import {useCallback, useMemo} from 'react';
import {isAddress} from 'viem';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import useWallet from '@lib/contexts/useWallet';
import {useWeb3} from '@lib/contexts/useWeb3';
import {useApprove} from '@lib/hooks/useApprove';
import {useAsyncTrigger} from '@lib/hooks/useAsyncTrigger';
import {useVaultDeposit} from '@lib/hooks/useDeposit';
import {useVaultWithdraw} from '@lib/hooks/useWithdraw';
import {ETH_TOKEN_ADDRESS, toAddress, toBigInt} from '@lib/utils';
import {CHAINS} from '@lib/utils/tools.chains';

import type {TAssertedVaultsConfiguration} from '@lib/contexts/useManageVaults';
import type {TSolverContextBase} from '@lib/contexts/useSolver';

export const useVanilaSolver = (
	isZapNeededForDeposit: boolean,
	isZapNeededForWithdraw: boolean
): TSolverContextBase => {
	const {provider, address, isWalletSafe} = useWeb3();
	const {configuration} = useManageVaults() as {configuration: TAssertedVaultsConfiguration};
	const {onRefresh} = useWallet();
	const isSolverEnabled =
		(!isZapNeededForDeposit && configuration.action === 'DEPOSIT') ||
		(!isZapNeededForWithdraw && configuration.action === 'WITHDRAW');

	/**********************************************************************************************
	 ** The isV3Vault hook is used to determine if the current vault is a V3 vault. It's very
	 ** important to know if the vault is a V3 vault because the deposit and withdraw functions
	 ** are different for V3 vaults, and only V3 vaults support the permit signature.
	 **
	 ** @returns isV3Vault: boolean - Whether the vault is a V3 vault or not.
	 *********************************************************************************************/
	const isV3Vault = useMemo(
		() =>
			configuration?.vault?.version.split('.')?.[0] === '3' ||
			configuration?.vault?.version.split('.')?.[0] === '~3',
		[configuration?.vault]
	);

	/**********************************************************************************************
	 ** The isLegacyVault hook is used to determine if the current vault is a legacy vault.
	 **
	 ** @returns isLegacyVault: boolean - Whether the vault is a legacy vault or not.
	 *********************************************************************************************/
	const isLegacyVault = useMemo(() => configuration?.vault?.kind === 'Legacy', [configuration?.vault]);

	/**********************************************************************************************
	 ** The yRouter hook is used to get the yearn router address for the current chain. If so, we
	 ** can use the permit signature flow for the deposit function.
	 **
	 ** @returns yRouter: TAddress - The yearn router address for the current chain.
	 *********************************************************************************************/
	const yRouter = useMemo(
		() => toAddress(CHAINS[configuration?.vault?.chainID]?.yearnRouterAddress),
		[configuration?.vault]
	);

	/**********************************************************************************************
	 ** The useApprove hook is used to approve the token to spend for the vault. This is used to
	 ** allow the vault to spend the token on behalf of the user. This is required for the deposit
	 ** function to work.
	 **
	 ** @returns isApproved: boolean - Whether the token is approved or not.
	 ** @returns isApproving: boolean - Whether the approval is in progress.
	 ** @returns onApprove: () => void - Function to approve the token.
	 ** @returns amountApproved: bigint - The amount approved.
	 ** @returns permitSignature: TPermitSignature - The permit signature.
	 ** @returns onClearPermit: () => void - Function to clear the permit signature.
	 *********************************************************************************************/
	const {isApproved, isApproving, onApprove, amountApproved, permitSignature, onClearPermit} = useApprove({
		provider,
		chainID: configuration?.vault?.chainID || 0,
		tokenToApprove: toAddress(configuration?.tokenToSpend.token?.address),
		spender: isV3Vault && isAddress(yRouter) ? yRouter : toAddress(configuration?.vault?.address),
		owner: toAddress(address),
		amountToApprove: toBigInt(configuration?.tokenToSpend.amount?.raw || 0n),
		shouldUsePermit: isV3Vault && isAddress(yRouter) && !isLegacyVault,
		deadline: 60,
		disabled: !isSolverEnabled
	});

	/**********************************************************************************************
	 ** The useVaultDeposit hook is used to deposit the token to the vault. It supports both V3
	 ** and legacy vaults and will work with the yRouters if a signature is provided.
	 **
	 ** @returns canDeposit: boolean - Whether the user can deposit the token (no allowance or
	 **			 balance checks are done here).
	 ** @returns isDepositing: boolean - Whether the deposit is in progress.
	 ** @returns onDeposit: () => void - Function to deposit the token.
	 ** @returns maxDepositForUser: bigint - The maximum amount the user can deposit.
	 *********************************************************************************************/
	const {canDeposit, isDepositing, onDeposit} = useVaultDeposit({
		chainID: configuration?.vault?.chainID || 0,
		tokenToDeposit: toAddress(configuration?.tokenToSpend.token?.address),
		vault: toAddress(configuration?.vault?.address),
		owner: toAddress(address),
		amountToDeposit: toBigInt(configuration?.tokenToSpend.amount?.raw || 0n),
		disabled: !isSolverEnabled,
		...(isV3Vault
			? {
					version: 'ERC-4626',
					options: {
						useRouter:
							!isLegacyVault &&
							isAddress(toAddress(CHAINS[configuration?.vault?.chainID].yearnRouterAddress)),
						routerAddress: toAddress(CHAINS[configuration?.vault?.chainID].yearnRouterAddress),
						minOutSlippage: 10n,
						permitSignature
					}
				}
			: {version: 'LEGACY'})
	});

	/**********************************************************************************************
	 ** The useVaultWithdraw hook is used to withdraw the token from the vault. It supports both V3
	 ** and legacy.
	 **
	 ** @returns maxWithdrawForUser: bigint - The maximum amount that can be withdrawn by the user.
	 **          This is exprimed in underlying token, so this means this is a shortcut for
	 **          `vault.convertToAsset(vault.balanceOf(owner))`.
	 ** @returns isWithdrawing: boolean - If the approval is in progress.
	 ** @returns onWithdraw: () => void - Function to withdraw the token.
	 *********************************************************************************************/
	const {isWithdrawing, onWithdraw, maxWithdrawForUser, balanceOf} = useVaultWithdraw({
		chainID: configuration?.vault?.chainID || 0,
		tokenToWithdraw: toAddress(configuration?.tokenToSpend.token?.address),
		vault: toAddress(configuration?.vault?.address),
		owner: toAddress(address),
		amountToWithdraw: toBigInt(configuration?.tokenToSpend.amount?.raw || 0n),
		disabled: !isSolverEnabled,
		redeemTolerance: 1n,
		...(isV3Vault ? {version: 'ERC-4626', minOutSlippage: 1n} : {version: 'LEGACY'})
	});

	/**********************************************************************************************
	 ** The onRefreshBalances function is used to refresh the balances of the user after an action
	 ** has been executed. This is used to update the UI with the new balances.
	 *********************************************************************************************/
	const onRefreshBalances = useCallback(
		async (config: TAssertedVaultsConfiguration): Promise<void> => {
			await onRefresh(
				[
					{chainID: config.vault.chainID, address: config.vault.address},
					{chainID: config.vault.chainID, address: config.vault.token.address},
					{chainID: config.vault.chainID, address: config.tokenToSpend.token.address},
					{chainID: config.vault.chainID, address: config.tokenToReceive.token.address},
					{chainID: config.vault.chainID, address: ETH_TOKEN_ADDRESS}
				],
				false,
				true
			);
		},
		[onRefresh]
	);

	/**********************************************************************************************
	 ** SWR hook to get the expected out for a given in/out pair with a specific amount. This hook
	 ** is called when amount/in or out changes. Calls the allowanceFetcher callback.
	 ** Note: we also clear the permit signature because this means that the user has changed the
	 ** amount or the token to spend.
	 *********************************************************************************************/
	useAsyncTrigger(async (): Promise<void> => {
		if (!configuration?.action || !isSolverEnabled) {
			return;
		}
		if (configuration.action === 'DEPOSIT' && isZapNeededForDeposit) {
			return;
		}
		if (configuration.action === 'WITHDRAW' && isZapNeededForWithdraw) {
			return;
		}
	}, [configuration.action, isZapNeededForDeposit, isZapNeededForWithdraw, isSolverEnabled]);

	/**********************************************************************************************
	 ** Trigger a deposit web3 action, simply trying to deposit `amount` tokens to
	 ** the selected vault.
	 *********************************************************************************************/
	const onExecuteDeposit = useCallback(async (): Promise<boolean> => {
		const isSuccess = await onDeposit();
		onClearPermit();
		if (isSuccess) {
			onRefreshBalances(configuration as TAssertedVaultsConfiguration);
		}
		return isSuccess;
	}, [configuration, onClearPermit, onDeposit, onRefreshBalances]);

	/*********************************************************************************************
	 ** Trigger a withdraw web3 action using the vault contract to take back some underlying token
	 ** from this specific vault.
	 *********************************************************************************************/
	const onExecuteWithdraw = useCallback(async (): Promise<boolean> => {
		const isSuccess = await onWithdraw();
		if (isSuccess) {
			onRefreshBalances(configuration as TAssertedVaultsConfiguration);
		}
		return isSuccess;
	}, [configuration, onRefreshBalances, onWithdraw]);

	return {
		isApproved,
		isApproving,
		isDepositing,
		isWithdrawing: isWithdrawing,
		canDeposit: canDeposit && (isApproved || isWalletSafe),
		allowance: amountApproved,
		permitSignature,
		onApprove,
		onDeposit: onExecuteDeposit,
		onWithdraw: onExecuteWithdraw,
		maxWithdraw: maxWithdrawForUser,
		vaultBalanceOf: balanceOf,
		canZap: true, //Not used in vanilla solver
		isFetchingQuote: false,
		quote: null
	};
};
