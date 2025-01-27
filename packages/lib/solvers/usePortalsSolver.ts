import {useCallback, useMemo, useState} from 'react';
import {zeroAddress} from 'viem';
import {useReadContract} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useApprove} from '@builtbymom/web3/hooks/useApprove';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {usePortals} from '@builtbymom/web3/hooks/usePortals';
import {
	ETH_TOKEN_ADDRESS,
	fromNormalized,
	isEthAddress,
	isZeroAddress,
	toAddress,
	toBigInt,
	toNormalizedBN,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {getPortalsApproval, PORTALS_NETWORK} from '@lib/utils/api.portals';
import {VAULT_ABI} from '@lib/utils/vault.abi';

import type {TransactionReceipt} from 'viem';
import type {TToken, TTokenAmountInputElement} from '@builtbymom/web3/types';
import type {TAssertedVaultsConfiguration} from '@lib/contexts/useManageVaults';
import type {TSolverContextBase} from '@lib/contexts/useSolver';
import type {TPortalsApproval} from '@lib/utils/api.portals';

export const usePortalsSolver = (
	isZapNeededForDeposit: boolean,
	isZapNeededForWithdraw: boolean
): TSolverContextBase => {
	const {configuration} = useManageVaults();
	const {address, provider} = useWeb3();
	const {onRefresh} = useWallet();
	const [approveCtx, set_approveCtx] = useState<TPortalsApproval>();
	const slippage = configuration.action === 'DEPOSIT' ? 0.25 : 1;
	const isSolverEnabled =
		(isZapNeededForDeposit && configuration.action === 'DEPOSIT') ||
		(isZapNeededForWithdraw && configuration.action === 'WITHDRAW');

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
	 ** If we are working with a withdraw, there are a few things we need to know:
	 ** As we are working with the UNDERLYING value, and we are spending the SHARE of the vault,
	 ** we need to convert the share to the underlying value and perform check based on that.
	 ** For V2 vaults, it's just linked to the Price Per Share, but for V3 vaults, this is
	 ** evolving with every blocks, and so a bunch of calculations are needed.
	 **
	 ** @returns shareOf: bigint - The number of shares the user has in the vault (v3)
	 ** @returns balanceOf: bigint - The value of underlying corresponding to the shares (v3)
	 ** @returns amountToWithdraw: bigint - The amount of shares to withdraw, converted from the
	 **          user's input (configuration?.tokenToSpend.amount?.raw) (v3)
	 ** @returns pricePerShare: bigint - The price per share of the vault (v2)
	 *********************************************************************************************/
	const {data: shareOf} = useReadContract({
		address: configuration.vault?.address,
		abi: VAULT_ABI,
		functionName: 'balanceOf',
		args: [toAddress(address)],
		chainId: configuration.vault?.chainID,
		query: {
			enabled: !isZeroAddress(address) && configuration.action === 'WITHDRAW' && isSolverEnabled
		}
	});
	const {data: balanceOf} = useReadContract({
		address: configuration.vault?.address,
		abi: VAULT_ABI,
		functionName: 'convertToAssets',
		args: [toBigInt(shareOf)],
		chainId: configuration.vault?.chainID,
		query: {
			enabled:
				Boolean(configuration.vault) &&
				Boolean(configuration.tokenToSpend.token) &&
				shareOf !== undefined &&
				!isZeroAddress(address) &&
				isV3Vault &&
				configuration.action === 'WITHDRAW' &&
				isSolverEnabled
		}
	});

	// const {data: amountToWithdraw} = useReadContract({
	// 	address: configuration.vault?.address,
	// 	abi: VAULT_ABI,
	// 	functionName: 'convertToShares',
	// 	args: [toBigInt(configuration?.tokenToSpend.amount?.raw)],
	// 	chainId: configuration.vault?.chainID,
	// 	query: {
	// 		enabled:
	// 			Boolean(configuration.vault) &&
	// 			Boolean(configuration.tokenToSpend.token) &&
	// 			isV3Vault &&
	// 			configuration.action === 'WITHDRAW' &&
	// 			isSolverEnabled
	// 	}
	// });

	const {data: pricePerShare} = useReadContract({
		address: configuration.vault?.address,
		abi: VAULT_ABI,
		chainId: configuration.vault?.chainID,
		functionName: 'pricePerShare',
		args: [],
		query: {
			enabled:
				Boolean(configuration.vault) && configuration.action === 'WITHDRAW' && !isV3Vault && isSolverEnabled
		}
	});

	/**********************************************************************************************
	 ** Due to the ever-changing nature of your share in the V3 vaults, the amount may change
	 ** between the time you request the quote and the time you actually perform the transaction.
	 ** To mitigate this, we check if the user is asking to withdraw at least 99% of their share
	 ** in the vault. If they are, we consider they want to zap all their balance.
	 **
	 ** @returns isZapingBalance: boolean - Whether the user is asking to zap all their balance or
	 **          not.
	 *********************************************************************************************/
	const isZapingBalance = useMemo(() => {
		const amount = toBigInt(configuration.tokenToSpend.amount?.raw);
		const tolerance = (toBigInt(shareOf) * 1n) / 10000n; // 1% of the balance
		const isAskingToZapAll = toBigInt(shareOf) - amount <= tolerance;
		return isAskingToZapAll;
	}, [configuration.tokenToSpend.amount?.raw, shareOf]);

	const pps = toNormalizedBN(toBigInt(pricePerShare || 0n), configuration.vault?.token.decimals || 18);

	/**********************************************************************************************
	 ** This way we calculate the amount of yvToken based on the selected token by dividing amount
	 ** by price per share
	 *********************************************************************************************/
	const vaultTokenAmount = useMemo(
		() => (pricePerShare ? +(configuration.tokenToSpend.amount?.display || 0) / +pps.display : 0),
		[configuration.tokenToSpend.amount?.display, pps.display, pricePerShare]
	);

	/**********************************************************************************************
	 ** Transform vaultTokenAmount to normalized
	 *********************************************************************************************/
	const normalizedVaultTokenAmount = useMemo(
		() =>
			toNormalizedBN(
				fromNormalized(vaultTokenAmount, configuration.vault?.token.decimals || 18),
				configuration.vault?.token.decimals || 18
			),
		[configuration.vault?.token.decimals, vaultTokenAmount]
	);

	/**********************************************************************************************
	 ** There are cases when normalizedVaultTokenAmount is slightly bigger than user's balance
	 ** despite correct calculations (or they are not correct). To handle this, take into futher
	 ** consideration the minimum of user balance and the calculated value.
	 *********************************************************************************************/
	const minNormalizedAmount = useMemo(() => {
		// If depositing, return the input amount
		if (configuration.action === 'DEPOSIT') {
			return configuration.tokenToSpend.amount || zeroNormalizedBN;
		}

		// If user seems to be withdrawing full amount, return balance
		if (toBigInt(shareOf) < normalizedVaultTokenAmount.raw || isZapingBalance) {
			return toNormalizedBN(toBigInt(shareOf), configuration.vault?.decimals || 18);
		}

		// Return converted shares
		return normalizedVaultTokenAmount;
	}, [
		configuration.action,
		configuration.tokenToSpend.amount,
		configuration.vault?.decimals,
		isZapingBalance,
		normalizedVaultTokenAmount,
		shareOf
	]);

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
		spender: toAddress(approveCtx?.context.spender || zeroAddress),
		owner: toAddress(address),
		amountToApprove: minNormalizedAmount.raw,
		shouldUsePermit: (approveCtx?.context.canPermit || false) && !isLegacyVault,
		deadline: 60,
		disabled: !isSolverEnabled
	});

	const inputAsset: TTokenAmountInputElement = useMemo(
		() => ({
			token: {
				...(configuration?.tokenToSpend.token as TToken),
				balance: zeroNormalizedBN
			},
			amount: minNormalizedAmount.display,
			normalizedBigAmount: minNormalizedAmount,
			status: 'none',
			isValid: 'undetermined',
			UUID: '1'
		}),
		[configuration?.tokenToSpend.token, minNormalizedAmount]
	);

	const {onExecuteDeposit, onRetrieveQuote, latestQuote, isFetchingQuote, isDepositing} = usePortals({
		inputAsset,
		outputTokenAddress:
			configuration.action === 'DEPOSIT'
				? configuration.vault?.address
				: configuration.tokenToReceive.token?.address,
		slippage: slippage.toString(),
		permitSignature,
		onClearPermit,
		disabled: !isSolverEnabled
	});

	/**********************************************************************************************
	 * Find the approve context to find the approve spender
	 *********************************************************************************************/
	useAsyncTrigger(async (): Promise<void> => {
		if (!isSolverEnabled) {
			set_approveCtx(undefined);
			return;
		}
		if (isEthAddress(configuration?.tokenToSpend.token?.address)) {
			set_approveCtx(undefined);
			return;
		}
		if (!configuration?.tokenToSpend.token || !configuration?.tokenToSpend?.amount?.raw) {
			set_approveCtx(undefined);
			return;
		}

		if (approveCtx?.context.target === configuration?.vault?.address) {
			return;
		}

		const network = PORTALS_NETWORK.get(configuration?.tokenToSpend.token.chainID);
		const {data: approval} = await getPortalsApproval({
			params: {
				sender: toAddress(address),
				inputToken: `${network}:${toAddress(configuration?.tokenToSpend.token.address)}`,
				inputAmount: minNormalizedAmount.raw.toString(),
				permitDeadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 60).toString()
			}
		});

		if (!approval) {
			set_approveCtx(undefined);
			return;
		}
		set_approveCtx(approval);
	}, [
		isSolverEnabled,
		configuration?.tokenToSpend.token,
		configuration?.tokenToSpend?.amount?.raw,
		configuration?.vault?.address,
		approveCtx?.context.target,
		address,
		minNormalizedAmount
	]);

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
		if (configuration.action === 'DEPOSIT' && !isZapNeededForDeposit) {
			return;
		}
		if (configuration.action === 'WITHDRAW' && !isZapNeededForWithdraw) {
			return;
		}
		if (configuration.action === 'WITHDRAW') {
			onRetrieveQuote();
		}
		if (configuration.action === 'DEPOSIT') {
			onRetrieveQuote();
		}
	}, [configuration.action, isZapNeededForDeposit, isZapNeededForWithdraw, onRetrieveQuote, isSolverEnabled]);

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
	 ** Trigger a deposit web3 action, simply trying to deposit `amount` tokens to
	 ** the selected vault.
	 *********************************************************************************************/
	const onDeposit = useCallback(
		async (onSuccess: (receipt: TransactionReceipt) => void): Promise<boolean> => {
			const isSuccess = await onExecuteDeposit(onSuccess);
			onClearPermit();
			if (isSuccess) {
				onRefreshBalances(configuration as TAssertedVaultsConfiguration);
			}
			return isSuccess;
		},
		[configuration, onClearPermit, onExecuteDeposit, onRefreshBalances]
	);

	return {
		isApproved,
		isApproving,
		canDeposit: isApproved && !isApproving && !isFetchingQuote && !!latestQuote,
		isDepositing: configuration.action === 'DEPOSIT' && isDepositing,
		allowance: amountApproved,
		permitSignature,
		onApprove,
		onDeposit,
		onWithdraw: onDeposit,
		isWithdrawing: configuration.action === 'WITHDRAW' && isDepositing,
		canZap: !!latestQuote && !isFetchingQuote,
		isFetchingQuote,
		quote: latestQuote || null,
		maxWithdraw: 0n,
		vaultBalanceOf: balanceOf
			? toBigInt(balanceOf)
			: toNormalizedBN(
					(toBigInt(shareOf) * toBigInt(pricePerShare)) /
						toBigInt(10 ** (configuration?.tokenToSpend?.token?.decimals || 18)),
					configuration.vault?.decimals || 18
				).raw
	};
};
