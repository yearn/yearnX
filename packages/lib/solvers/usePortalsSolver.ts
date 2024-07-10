import {useCallback, useRef, useState} from 'react';
import {BaseError, erc20Abi, isHex, zeroAddress} from 'viem';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {
	assert,
	assertAddress,
	isEthAddress,
	MAX_UINT_256,
	toAddress,
	toBigInt,
	toNormalizedBN,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {approveERC20, defaultTxStatus, retrieveConfig, toWagmiProvider} from '@builtbymom/web3/utils/wagmi';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {useIsZapNeeded} from '@lib/hooks/useIsZapNeeded';
import {
	getPortalsApproval,
	getPortalsTx,
	getQuote,
	PORTALS_NETWORK,
	type TPortalsEstimate
} from '@lib/utils/api.portals';
import {isValidPortalsErrorObject} from '@lib/utils/isValidPortalsErrorObject';
import {allowanceKey} from '@lib/utils/tools';
import {readContract, sendTransaction, switchChain, waitForTransactionReceipt} from '@wagmi/core';

import type {TDict, TNormalizedBN} from '@builtbymom/web3/types';
import type {TTxResponse} from '@builtbymom/web3/utils/wagmi';
import type {TSolverContextBase} from '@lib/contexts/useSolver';
import type {TInitSolverArgs} from '@lib/utils/solvers';

export const usePortalsSolver = (): TSolverContextBase => {
	const {configuration} = useManageVaults();
	const {address, provider} = useWeb3();

	const isZapNeeded = useIsZapNeeded();

	const [approvalStatus, set_approvalStatus] = useState(defaultTxStatus);
	const [depositStatus, set_depositStatus] = useState(defaultTxStatus);

	const [allowance, set_allowance] = useState<TNormalizedBN>(zeroNormalizedBN);

	const spendAmount = configuration?.tokenToSpend.amount?.raw ?? 0n;
	const isAboveAllowance = allowance.raw >= spendAmount;

	const [isFetchingAllowance, set_isFetchingAllowance] = useState(false);

	const [latestQuote, set_latestQuote] = useState<TPortalsEstimate>();
	const [isFetchingQuote, set_isFetchingQuote] = useState(false);

	const existingAllowances = useRef<TDict<TNormalizedBN>>({});

	const onRetrieveQuote = useCallback(async () => {
		if (!configuration?.tokenToSpend.token || !configuration?.vault) {
			return;
		}

		const request: TInitSolverArgs = {
			chainID: configuration?.tokenToSpend.token.chainID,
			version: configuration?.vault.version,
			from: toAddress(address),
			inputToken: configuration?.tokenToSpend.token.address,
			outputToken: configuration?.vault.address,
			inputAmount: configuration?.tokenToSpend.amount?.raw ?? 0n,
			isDepositing: true,
			stakingPoolAddress: undefined
		};

		set_isFetchingQuote(true);

		const {result, error} = await getQuote(request, 0.01);
		if (!result) {
			if (error) {
				console.error(error);
			}
			return undefined;
		}
		set_latestQuote(result);
		set_isFetchingQuote(false);

		return result;
	}, [address, configuration?.tokenToSpend.amount?.raw, configuration?.tokenToSpend.token, configuration?.vault]);

	useAsyncTrigger(async (): Promise<void> => {
		/******************************************************************************************
		 * Skip quote fetching if form is not populated fully or zap is not needed
		 *****************************************************************************************/
		if (!isZapNeeded) {
			return;
		}
		onRetrieveQuote();
	}, [isZapNeeded, onRetrieveQuote]);

	/**********************************************************************************************
	 * Retrieve the allowance for the token to be used by the solver. This will be used to
	 * determine if the user should approve the token or not.
	 **********************************************************************************************/
	const onRetrieveAllowance = useCallback(
		async (shouldForceRefetch?: boolean): Promise<TNormalizedBN> => {
			if (!latestQuote || !configuration?.tokenToSpend.token || !configuration?.vault) {
				return zeroNormalizedBN;
			}

			const inputToken = configuration?.tokenToSpend.token.address;
			const outputToken = configuration?.vault.address;

			if (isEthAddress(inputToken)) {
				return toNormalizedBN(MAX_UINT_256, 18);
			}

			const key = allowanceKey(
				configuration?.tokenToSpend.token?.chainID,
				toAddress(inputToken),
				toAddress(outputToken),
				toAddress(address)
			);
			if (existingAllowances.current[key] && !shouldForceRefetch) {
				return existingAllowances.current[key];
			}

			set_isFetchingAllowance(true);

			try {
				const network = PORTALS_NETWORK.get(configuration?.tokenToSpend.token.chainID);
				const {data: approval} = await getPortalsApproval({
					params: {
						sender: toAddress(address),
						inputToken: `${network}:${toAddress(inputToken)}`,
						inputAmount: toBigInt(configuration?.tokenToSpend.amount?.raw).toString()
					}
				});

				if (!approval) {
					throw new Error('Portals approval not found');
				}

				existingAllowances.current[key] = toNormalizedBN(
					toBigInt(approval.context.allowance),
					configuration?.tokenToSpend.token.decimals
				);

				set_isFetchingAllowance(false);

				return existingAllowances.current[key];
			} catch (err) {
				set_isFetchingAllowance(false);
				return zeroNormalizedBN;
			}
		},
		[
			address,
			configuration?.tokenToSpend.amount?.raw,
			configuration?.tokenToSpend.token,
			configuration?.vault,
			latestQuote
		]
	);

	/**********************************************************************************************
	 * SWR hook to get the expected out for a given in/out pair with a specific amount. This hook
	 * is called when amount/in or out changes. Calls the allowanceFetcher callback.
	 *********************************************************************************************/
	const triggerRetreiveAllowance = useAsyncTrigger(async (): Promise<void> => {
		/******************************************************************************************
		 * Skip allowance fetching if form is not populated fully or zap is not needed
		 *****************************************************************************************/
		if (!isZapNeeded) {
			return;
		}
		set_allowance(await onRetrieveAllowance(true));
	}, [isZapNeeded, onRetrieveAllowance]);

	/**********************************************************************************************
	 * Trigger an signature to approve the token to be used by the Portals
	 * solver. A single signature is required, which will allow the spending
	 * of the token by the Portals solver.
	 *********************************************************************************************/
	const onApprove = useCallback(
		async (onSuccess: () => void): Promise<void> => {
			if (!provider) {
				return;
			}

			assert(configuration?.tokenToSpend.token, 'Input token is not set');
			assert(configuration?.tokenToSpend.amount, 'Input amount is not set');

			const amount = configuration?.tokenToSpend.amount.raw;

			try {
				const network = PORTALS_NETWORK.get(configuration?.tokenToSpend.token.chainID);
				const {data: approval} = await getPortalsApproval({
					params: {
						sender: toAddress(address),
						inputToken: `${network}:${toAddress(configuration?.tokenToSpend.token.address)}`,
						inputAmount: toBigInt(configuration?.tokenToSpend.amount.raw).toString()
					}
				});

				if (!approval) {
					return;
				}

				const allowance = await readContract(retrieveConfig(), {
					chainId: Number(configuration?.vault?.chainID),
					abi: erc20Abi,
					address: toAddress(configuration?.tokenToSpend?.token.address),
					functionName: 'allowance',
					args: [toAddress(address), toAddress(approval.context.spender)]
				});

				if (allowance < amount) {
					assertAddress(approval.context.spender, 'spender');
					const result = await approveERC20({
						connector: provider,
						chainID: configuration?.tokenToSpend.token.chainID,
						contractAddress: configuration?.tokenToSpend.token.address,
						spenderAddress: approval.context.spender,
						amount: amount,
						statusHandler: set_approvalStatus
					});
					if (result.isSuccessful) {
						onSuccess();
					}
					triggerRetreiveAllowance();
					return;
				}
				onSuccess();
				triggerRetreiveAllowance();
				return;
			} catch (error) {
				console.error(error);
				return;
			}
		},
		[address, configuration, provider, triggerRetreiveAllowance]
	);

	/**********************************************************************************************
	 * execute will send the post request to execute the order and wait for it to be executed, no
	 * matter the result. It returns a boolean value indicating whether the order was successful or
	 * not.
	 *********************************************************************************************/
	const execute = useCallback(async (): Promise<TTxResponse> => {
		assert(provider, 'Provider is not set');
		assert(latestQuote, 'Quote is not set');
		assert(configuration?.tokenToSpend.token, 'Input token is not set');
		assert(configuration?.vault, 'Output token is not set');

		try {
			let inputToken = configuration?.tokenToSpend.token.address;
			const outputToken = configuration?.vault.address;
			if (isEthAddress(inputToken)) {
				inputToken = zeroAddress;
			}
			const network = PORTALS_NETWORK.get(configuration?.tokenToSpend.token.chainID);
			const transaction = await getPortalsTx({
				params: {
					sender: toAddress(address),
					inputToken: `${network}:${toAddress(inputToken)}`,
					outputToken: `${network}:${toAddress(outputToken)}`,
					inputAmount: toBigInt(configuration?.tokenToSpend.amount?.raw).toString(),
					slippageTolerancePercentage: String(1),
					// feePercentage: '0',
					// partner: ?,
					validate: 'true'
				}
			});

			if (!transaction.result) {
				throw new Error('Transaction data was not fetched from Portals!');
			}

			const {
				tx: {value, to, data, ...rest}
			} = transaction.result;
			const wagmiProvider = await toWagmiProvider(provider);

			if (wagmiProvider.chainId !== configuration?.tokenToSpend.token.chainID) {
				try {
					await switchChain(retrieveConfig(), {chainId: configuration?.tokenToSpend.token.chainID});
				} catch (error) {
					if (!(error instanceof BaseError)) {
						return {isSuccessful: false, error};
					}
					console.error(error.shortMessage);

					return {isSuccessful: false, error};
				}
			}

			assert(isHex(data), 'Data is not hex');
			assert(wagmiProvider.walletClient, 'Wallet client is not set');
			const hash = await sendTransaction(retrieveConfig(), {
				value: toBigInt(value ?? 0),
				to: toAddress(to),
				data,
				chainId: configuration?.tokenToSpend.token.chainID,
				...rest
			});
			const receipt = await waitForTransactionReceipt(retrieveConfig(), {
				chainId: wagmiProvider.chainId,
				hash
			});
			if (receipt.status === 'success') {
				return {isSuccessful: true, receipt: receipt};
			}
			console.error('Fail to perform transaction');
			return {isSuccessful: false};
		} catch (error) {
			if (isValidPortalsErrorObject(error)) {
				const errorMessage = error.response.data.message;
				console.error(errorMessage);
			} else {
				console.error(error);
			}

			return {isSuccessful: false};
		}
	}, [
		address,
		configuration?.tokenToSpend.amount?.raw,
		configuration?.tokenToSpend.token,
		configuration?.vault,
		latestQuote,
		provider
	]);

	/**********************************************************************************************
	 * This execute function is not an actual deposit/withdraw, but a swap using the Portals
	 * solver. The deposit will be executed by the Portals solver by simply swapping the input token
	 * for the output token.
	 *********************************************************************************************/
	const onExecuteDeposit = useCallback(
		async (onSuccess: () => void): Promise<void> => {
			assert(provider, 'Provider is not set');

			set_depositStatus({...defaultTxStatus, pending: true});
			const status = await execute();
			if (status.isSuccessful) {
				set_depositStatus({...defaultTxStatus, success: true});
				onSuccess();
			} else {
				set_depositStatus({...defaultTxStatus, error: true});
			}
		},
		[execute, provider]
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

		isFetchingQuote,
		quote: latestQuote || null
	};
};
