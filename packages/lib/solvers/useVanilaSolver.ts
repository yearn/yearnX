import {useCallback, useMemo, useRef, useState} from 'react';
import {encodeFunctionData, erc20Abi, zeroAddress} from 'viem';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {
	assert,
	ETH_TOKEN_ADDRESS,
	isAddress,
	toAddress,
	toBigInt,
	toNormalizedBN,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {defaultTxStatus, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {useSafeAppsSDK} from '@gnosis.pm/safe-apps-react-sdk';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {isSupportingPermit, signPermit} from '@lib/hooks/usePermit';
import {approveERC20, deposit, depositViaRouter, redeemV3Shares, withdrawShares} from '@lib/utils/actions';
import {getApproveTransaction, getDepositTransaction} from '@lib/utils/gnosis.tools';
import {allowanceKey} from '@lib/utils/tools';
import {CHAINS} from '@lib/utils/tools.chains';
import {YEARN_4626_ROUTER_ABI} from '@lib/utils/vaultRouter.abi.ts';
import {readContract} from '@wagmi/core';

import type {TDict, TNormalizedBN} from '@builtbymom/web3/types';
import type {TTxResponse} from '@builtbymom/web3/utils/wagmi';
import type {TAssertedVaultsConfiguration} from '@lib/contexts/useManageVaults';
import type {TSolverContextBase} from '@lib/contexts/useSolver';
import type {TPermitSignature} from '@lib/hooks/usePermit.types';

export const useVanilaSolver = (
	isZapNeededForDeposit: boolean,
	isZapNeededForWithdraw: boolean
): TSolverContextBase => {
	const {configuration} = useManageVaults();
	const {provider, address} = useWeb3();
	const {onRefresh} = useWallet();
	const [isFetchingAllowance, set_isFetchingAllowance] = useState(false);
	const [approvalStatus, set_approvalStatus] = useState(defaultTxStatus);
	const [depositStatus, set_depositStatus] = useState(defaultTxStatus);
	const [withdrawStatus, set_withdrawStatus] = useState(defaultTxStatus);
	const [allowance, set_allowance] = useState<TNormalizedBN>(zeroNormalizedBN);
	const [permitSignature, set_permitSignature] = useState<TPermitSignature | undefined>(undefined);
	const existingAllowances = useRef<TDict<TNormalizedBN>>({});
	const spendAmount = configuration?.tokenToSpend.amount?.raw ?? 0n;
	const isAboveAllowance = allowance.raw >= spendAmount;
	const {sdk} = useSafeAppsSDK();

	/**********************************************************************************************
	 ** The isV3Vault hook is used to determine if the current vault is a V3 vault. It's very
	 ** important to know if the vault is a V3 vault because the deposit and withdraw functions
	 ** are different for V3 vaults, and only V3 vaults support the permit signature.
	 *********************************************************************************************/
	const isV3Vault = useMemo(() => configuration?.vault?.version.split('.')?.[0] === '3', [configuration?.vault]);

	/**********************************************************************************************
	 ** Retrieve the allowance for the token to be used by the solver. This will
	 ** be used to determine if the user should approve the token or not.
	 *********************************************************************************************/
	const onRetrieveAllowance = useCallback(
		async (shouldForceRefetch?: boolean): Promise<TNormalizedBN> => {
			if (
				!configuration?.tokenToSpend.token ||
				configuration?.tokenToSpend.amount === zeroNormalizedBN ||
				!configuration?.vault ||
				!provider ||
				configuration?.tokenToSpend.token.address === ETH_TOKEN_ADDRESS
			) {
				return zeroNormalizedBN;
			}

			const key = allowanceKey(
				configuration?.vault.chainID,
				toAddress(configuration?.tokenToSpend.token.address),
				toAddress(configuration?.vault.address),
				toAddress(address)
			);
			if (existingAllowances.current[key] && !shouldForceRefetch) {
				return existingAllowances.current[key];
			}

			set_isFetchingAllowance(true);
			const allowance = await readContract(retrieveConfig(), {
				chainId: Number(configuration?.vault.chainID),
				abi: erc20Abi,
				address: toAddress(configuration?.tokenToSpend?.token.address),
				functionName: 'allowance',
				args: [toAddress(address), toAddress(configuration?.vault.address)]
			});

			set_isFetchingAllowance(false);

			existingAllowances.current[key] = toNormalizedBN(allowance, configuration?.tokenToSpend?.token.decimals);
			return existingAllowances.current[key];
		},
		[address, configuration?.tokenToSpend.amount, configuration?.tokenToSpend.token, configuration?.vault, provider]
	);

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
		set_permitSignature(undefined);
		set_approvalStatus(defaultTxStatus);
		set_depositStatus(defaultTxStatus);
		set_withdrawStatus(defaultTxStatus);
		set_allowance(await onRetrieveAllowance(false));
	}, [configuration.action, isZapNeededForDeposit, isZapNeededForWithdraw, onRetrieveAllowance]);

	/**********************************************************************************************
	 ** Trigger an approve web3 action, simply trying to approve `amount` tokens
	 ** to be used by the final vault, in charge of depositing the tokens.
	 ** This approve can not be triggered if the wallet is not active
	 ** (not connected) or if the tx is still pending.
	 *********************************************************************************************/
	const onApprove = useCallback(
		async (onSuccess?: () => void): Promise<void> => {
			assert(configuration?.tokenToSpend.token, 'Input token is not set');
			assert(configuration?.vault, 'Output token is not set');
			const config = configuration as TAssertedVaultsConfiguration;

			const shouldUsePermit = await isSupportingPermit({
				contractAddress: config.tokenToSpend.token.address,
				chainID: config.vault.chainID
			});
			if (shouldUsePermit && isV3Vault && isAddress(CHAINS[config.vault.chainID].yearnRouterAddress)) {
				set_approvalStatus({...defaultTxStatus, pending: true});
				const signature = await signPermit({
					contractAddress: config.tokenToSpend.token.address,
					ownerAddress: toAddress(address),
					spenderAddress: toAddress(CHAINS[configuration.vault.chainID].yearnRouterAddress),
					value: config.tokenToSpend.amount?.raw || 0n,
					deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 60), // 60 minutes
					chainID: config.vault.chainID
				});

				set_approvalStatus({...defaultTxStatus, success: !!signature});
				if (!signature) {
					set_permitSignature(undefined);
					set_allowance(zeroNormalizedBN);
				} else {
					set_allowance(config.tokenToSpend.amount || zeroNormalizedBN);
					set_permitSignature(signature);
				}
			} else {
				const result = await approveERC20({
					connector: provider,
					chainID: config.vault.chainID,
					contractAddress: config.tokenToSpend.token.address,
					spenderAddress: config.vault.address,
					amount: config.tokenToSpend.amount?.raw || 0n,
					statusHandler: set_approvalStatus
				});
				set_allowance(await onRetrieveAllowance(true));
				if (result.isSuccessful) {
					onSuccess?.();
				} else {
					set_permitSignature(undefined);
					set_allowance(zeroNormalizedBN);
				}
			}
		},
		[configuration, address, provider, onRetrieveAllowance, isV3Vault]
	);

	const onDepositForGnosis = useCallback(
		async (onSuccess?: () => void): Promise<void> => {
			const batch = [];
			const approveTransactionForBatch = getApproveTransaction(
				toBigInt(configuration?.tokenToSpend.amount?.raw).toString(),
				toAddress(configuration?.tokenToSpend.token?.address),
				toAddress(configuration?.vault?.address)
			);

			if (zeroAddress !== toAddress(configuration?.tokenToSpend.token?.address)) {
				batch.push(approveTransactionForBatch);
			}

			const depositTransactionForBatch = getDepositTransaction(
				toAddress(configuration?.vault?.address),
				toBigInt(configuration?.tokenToSpend?.amount?.raw).toString(),
				toAddress(address)
			);

			batch.push(depositTransactionForBatch);
			let result;

			try {
				const res = sdk.txs.send({txs: batch});

				do {
					result = await sdk.txs.getBySafeTxHash((await res).safeTxHash);
					await new Promise(resolve => setTimeout(resolve, 30_000));
				} while (
					result.txStatus !== 'SUCCESS' &&
					result.txStatus !== 'FAILED' &&
					result.txStatus !== 'CANCELLED'
				);
				onSuccess?.();
				await onRefresh(
					[
						{
							chainID: Number(configuration?.vault?.chainID),
							address: toAddress(configuration?.vault?.address)
						},
						{
							chainID: Number(configuration?.vault?.chainID),
							address: toAddress(configuration?.vault?.token?.address)
						},
						{chainID: Number(configuration?.vault?.chainID), address: ETH_TOKEN_ADDRESS}
					],
					false,
					true
				);
			} catch (err) {
				console.error(err);
			}
		},
		[
			address,
			configuration?.tokenToSpend.amount?.raw,
			configuration?.tokenToSpend.token?.address,
			configuration?.vault?.address,
			configuration?.vault?.chainID,
			configuration?.vault?.token?.address,
			onRefresh,
			sdk.txs
		]
	);

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
			onRetrieveAllowance(true);
			if (result.isSuccessful) {
				onSuccess?.();
			} else {
				if (permitSignature) {
					set_permitSignature(undefined);
					set_allowance(zeroNormalizedBN);
				}
			}
			set_depositStatus({...defaultTxStatus, success: result.isSuccessful});
		},
		[configuration, onRefreshBalances, onRetrieveAllowance, permitSignature, provider]
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
		onDepositForGnosis,

		/**Withdraw part */
		withdrawStatus,
		onExecuteWithdraw,
		set_withdrawStatus,

		/** Approval part */
		approvalStatus,
		allowance,
		permitSignature,
		isFetchingAllowance,
		isApproved: isAboveAllowance,
		isDisabled: !approvalStatus.none,
		onApprove,

		canZap: true, //Not used in vanilla solver
		isFetchingQuote: false,
		quote: null
	};
};
