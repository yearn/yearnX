import {useCallback, useRef, useState} from 'react';
import {erc20Abi} from 'viem';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {assert, ETH_TOKEN_ADDRESS, toAddress, toBigInt, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {approveERC20, defaultTxStatus, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {useIsZapNeeded} from '@lib/hooks/useIsZapNeeded';
import {deposit} from '@lib/utils/actions';
import {allowanceKey} from '@lib/utils/tools';
import {readContract} from '@wagmi/core';

import type {TDict, TNormalizedBN} from '@builtbymom/web3/types';
import type {TSolverContextBase} from '@lib/contexts/useSolver';

export const useVanilaSolver = (): TSolverContextBase => {
	const {configuration, dispatchConfiguration} = useManageVaults();
	const {provider, address} = useWeb3();
	const isZapNeeded = useIsZapNeeded();
	const {onRefresh} = useWallet();

	const [approvalStatus, set_approvalStatus] = useState(defaultTxStatus);
	const [depositStatus, set_depositStatus] = useState(defaultTxStatus);

	const [allowance, set_allowance] = useState<TNormalizedBN>(zeroNormalizedBN);

	const spendAmount = configuration?.tokenToSpend.amount?.raw ?? 0n;
	const isAboveAllowance = allowance.raw >= spendAmount;

	const [isFetchingAllowance, set_isFetchingAllowance] = useState(false);

	const existingAllowances = useRef<TDict<TNormalizedBN>>({});

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
	 ** SWR hook to get the expected out for a given in/out pair with a specific amount. This hook
	 ** is called when amount/in or out changes. Calls the allowanceFetcher callback.
	 *********************************************************************************************/
	const triggerRetreiveAllowance = useAsyncTrigger(async (): Promise<void> => {
		/******************************************************************************************
		 * Skip allowance fetching if form is not populated fully or zap needed
		 *****************************************************************************************/
		if (isZapNeeded) {
			return;
		}
		set_allowance(await onRetrieveAllowance(true));
	}, [isZapNeeded, onRetrieveAllowance]);

	/**********************************************************************************************
	 ** Trigger an approve web3 action, simply trying to approve `amount` tokens
	 ** to be used by the final vault, in charge of depositing the tokens.
	 ** This approve can not be triggered if the wallet is not active
	 ** (not connected) or if the tx is still pending.
	 *********************************************************************************************/
	const onApprove = useCallback(
		async (onSuccess: () => void): Promise<void> => {
			assert(configuration?.tokenToSpend.token, 'Input token is not set');
			assert(configuration?.vault, 'Output token is not set');

			const result = await approveERC20({
				connector: provider,
				chainID: configuration?.vault.chainID,
				contractAddress: configuration?.tokenToSpend.token.address,
				spenderAddress: configuration?.vault.address,
				amount: configuration?.tokenToSpend.amount?.raw || 0n,
				statusHandler: set_approvalStatus
			});
			if (result.isSuccessful) {
				onSuccess();
				triggerRetreiveAllowance();
			}
		},
		[
			configuration?.tokenToSpend.amount?.raw,
			configuration?.tokenToSpend.token,
			configuration?.vault,
			provider,
			triggerRetreiveAllowance
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

			set_depositStatus({...defaultTxStatus, pending: true});

			const result = await deposit({
				connector: provider,
				chainID: configuration?.vault?.chainID,
				contractAddress: toAddress(configuration?.vault?.address),
				amount: toBigInt(configuration?.tokenToSpend?.amount?.raw),
				statusHandler: set_depositStatus
			});
			if (result.isSuccessful) {
				await onRefresh([
					{chainID: configuration?.vault?.chainID, address: configuration?.vault?.address},
					{chainID: configuration?.vault?.chainID, address: configuration?.vault?.token?.address}
				]);
				dispatchConfiguration({type: 'SET_TOKEN_TO_SPEND', payload: {amount: undefined}});
				// onClose();
			}
			if (result.isSuccessful) {
				onSuccess();
				set_depositStatus({...defaultTxStatus, success: true});
				return;
			}
			set_depositStatus({...defaultTxStatus, error: true});
		},
		[
			configuration?.tokenToSpend.amount?.raw,
			configuration?.tokenToSpend?.token?.address,
			configuration?.vault?.address,
			configuration?.vault?.chainID,
			configuration?.vault?.token.address,
			dispatchConfiguration,
			onRefresh,
			provider
		]
	);

	return {
		/** Deposit part */
		depositStatus,
		set_depositStatus,
		onExecuteDeposit,

		/** Approval part */
		approvalStatus,
		allowance,
		isFetchingAllowance,
		isApproved: isAboveAllowance,
		isDisabled: !approvalStatus.none,
		onApprove,

		isFetchingQuote: false,
		quote: null
	};
};
