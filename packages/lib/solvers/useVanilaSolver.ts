import {useCallback, useMemo, useState} from 'react';
import {encodeFunctionData, isAddress} from 'viem';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useApprove} from '@builtbymom/web3/hooks/useApprove';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {assert, ETH_TOKEN_ADDRESS, toAddress, toBigInt} from '@builtbymom/web3/utils';
import {defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {deposit, depositViaRouter, redeemV3Shares, withdrawShares} from '@lib/utils/actions';
import {CHAINS} from '@lib/utils/tools.chains';
import {YEARN_4626_ROUTER_ABI} from '@lib/utils/vaultRouter.abi.ts';

import type {TTxResponse} from '@builtbymom/web3/utils/wagmi';
import type {TAssertedVaultsConfiguration} from '@lib/contexts/useManageVaults';
import type {TSolverContextBase} from '@lib/contexts/useSolver';

export const useVanilaSolver = (
	isZapNeededForDeposit: boolean,
	isZapNeededForWithdraw: boolean
): TSolverContextBase => {
	const {configuration} = useManageVaults() as {configuration: TAssertedVaultsConfiguration};
	const {provider, address} = useWeb3();
	const {onRefresh} = useWallet();
	const [depositStatus, set_depositStatus] = useState(defaultTxStatus);
	const [withdrawStatus, set_withdrawStatus] = useState(defaultTxStatus);

	/**********************************************************************************************
	 ** The isV3Vault hook is used to determine if the current vault is a V3 vault. It's very
	 ** important to know if the vault is a V3 vault because the deposit and withdraw functions
	 ** are different for V3 vaults, and only V3 vaults support the permit signature.
	 *********************************************************************************************/
	const isV3Vault = useMemo(() => configuration?.vault?.version.split('.')?.[0] === '3', [configuration?.vault]);

	/**********************************************************************************************
	 ** The useApprove hook is used to approve the token to spend for the vault. This is used to
	 ** allow the vault to spend the token on behalf of the user. This is required for the deposit
	 ** function to work.
	 *********************************************************************************************/
	const {isApproved, isApproving, onApprove, amountApproved, permitSignature, onClearPermit} = useApprove({
		provider,
		chainID: configuration?.vault?.chainID || 0,
		tokenToApprove: toAddress(configuration?.tokenToSpend.token?.address),
		spender:
			isV3Vault && isAddress(toAddress(CHAINS[configuration?.vault?.chainID].yearnRouterAddress))
				? toAddress(CHAINS[configuration?.vault?.chainID].yearnRouterAddress)
				: toAddress(configuration?.vault?.address),
		owner: toAddress(address),
		amountToApprove: toBigInt(configuration?.tokenToSpend.amount?.raw || 0n),
		shouldUsePermit: isV3Vault && isAddress(toAddress(CHAINS[configuration?.vault?.chainID].yearnRouterAddress)),
		deadline: 60
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
		if (!configuration?.action) {
			return;
		}
		if (configuration.action === 'DEPOSIT' && isZapNeededForDeposit) {
			return;
		}
		if (configuration.action === 'WITHDRAW' && isZapNeededForWithdraw) {
			return;
		}
		set_depositStatus(defaultTxStatus);
		set_withdrawStatus(defaultTxStatus);
	}, [configuration.action, isZapNeededForDeposit, isZapNeededForWithdraw]);

	/**********************************************************************************************
	 ** Trigger a deposit web3 action, simply trying to deposit `amount` tokens to
	 ** the selected vault.
	 *********************************************************************************************/
	const onExecuteDeposit = useCallback(
		async (onSuccess: () => void): Promise<void> => {
			assert(configuration?.vault?.address, 'Output token is not set');
			assert(configuration?.tokenToSpend?.token?.address, 'Input amount is not set');
			const config = configuration as TAssertedVaultsConfiguration;
			set_depositStatus({...defaultTxStatus, pending: true});

			let result: TTxResponse | undefined = undefined;
			if (permitSignature) {
				result = await depositViaRouter({
					connector: provider,
					statusHandler: set_depositStatus,
					chainID: config.vault?.chainID,
					contractAddress: toAddress(CHAINS[configuration.vault.chainID].yearnRouterAddress),
					amount: toBigInt(config.tokenToSpend.amount.raw),
					token: toAddress(config.tokenToSpend.token.address),
					vault: toAddress(config.vault.address),
					permitCalldata: encodeFunctionData({
						abi: YEARN_4626_ROUTER_ABI,
						functionName: 'selfPermit',
						args: [
							toAddress(config.tokenToSpend.token.address),
							toBigInt(config.tokenToSpend.amount.raw),
							permitSignature.deadline,
							permitSignature.v,
							permitSignature.r,
							permitSignature.s
						]
					})
				});
			} else {
				result = await deposit({
					connector: provider,
					chainID: config.vault.chainID,
					contractAddress: toAddress(config.vault.address),
					amount: toBigInt(config.tokenToSpend.amount.raw),
					statusHandler: set_depositStatus
				});
			}

			onRefreshBalances(config);
			if (result.isSuccessful) {
				onSuccess?.();
			}
			onClearPermit();
			set_depositStatus({...defaultTxStatus, success: result.isSuccessful});
		},
		[configuration, onClearPermit, onRefreshBalances, permitSignature, provider]
	);

	/*********************************************************************************************
	 ** Trigger a withdraw web3 action using the vault contract to take back some underlying token
	 ** from this specific vault.
	 *********************************************************************************************/
	const onExecuteWithdraw = useCallback(
		async (onSuccess?: () => void): Promise<void> => {
			assert(configuration?.tokenToReceive?.token, 'Output token is not set');
			assert(configuration?.tokenToReceive?.amount?.display, 'Input amount is not set');
			assert(configuration.vault, 'Vault is not set');
			const config = configuration as TAssertedVaultsConfiguration;

			set_withdrawStatus({...defaultTxStatus, pending: true});

			let result;
			if (isV3Vault) {
				result = await redeemV3Shares({
					connector: provider,
					chainID: config.vault.chainID,
					contractAddress: config.vault.address,
					amount: config.tokenToReceive.amount.raw
				});
			} else {
				result = await withdrawShares({
					connector: provider,
					chainID: config.vault.chainID,
					contractAddress: config.vault.token.address,
					amount: config.tokenToReceive.amount.raw
				});
			}
			onRefreshBalances(config);
			result.isSuccessful ? onSuccess?.() : null;
			set_withdrawStatus({...defaultTxStatus, success: result.isSuccessful});
		},
		[configuration, isV3Vault, onRefreshBalances, provider]
	);

	return {
		/** Deposit part */
		depositStatus,
		set_depositStatus,
		onExecuteDeposit,

		/**Withdraw part */
		withdrawStatus,
		onExecuteWithdraw,
		set_withdrawStatus,

		/** Approval part */
		onApprove,
		allowance: amountApproved,
		permitSignature,
		isApproving,
		isApproved,

		canZap: true, //Not used in vanilla solver
		isFetchingQuote: false,
		quote: null
	};
};
