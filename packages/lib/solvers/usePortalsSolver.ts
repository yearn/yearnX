import {useCallback, useRef, useState} from 'react';
import {BaseError, encodeFunctionData, erc20Abi, isHex, zeroAddress} from 'viem';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {
	assert,
	assertAddress,
	ETH_TOKEN_ADDRESS,
	isEthAddress,
	MAX_UINT_256,
	toAddress,
	toBigInt,
	toNormalizedBN,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {defaultTxStatus, getNetwork, retrieveConfig, toWagmiProvider} from '@builtbymom/web3/utils/wagmi';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {isSupportingPermit, signPermit} from '@lib/hooks/usePermit';
import {approveERC20, multicall} from '@lib/utils/actions';
import {
	getPortalsApproval,
	getPortalsTx,
	getQuote,
	PORTALS_NETWORK,
	type TPortalsEstimate
} from '@lib/utils/api.portals';
import {isValidPortalsErrorObject} from '@lib/utils/isValidPortalsErrorObject';
import {erc20AbiWithPermit} from '@lib/utils/permit.abi';
import {allowanceKey} from '@lib/utils/tools';
import {CHAINS} from '@lib/utils/tools.chains';
import {readContract, sendTransaction, switchChain, waitForTransactionReceipt} from '@wagmi/core';

import type {TAddress, TDict, TNormalizedBN} from '@builtbymom/web3/types';
import type {TTxResponse} from '@builtbymom/web3/utils/wagmi';
import type {TAssertedVaultsConfiguration} from '@lib/contexts/useManageVaults';
import type {TSolverContextBase} from '@lib/contexts/useSolver';
import type {TPermitSignature} from '@lib/hooks/usePermit.types';
import type {TInitSolverArgs} from '@lib/utils/solvers';

export const usePortalsSolver = (
	isZapNeededForDeposit: boolean,
	isZapNeededForWithdraw: boolean
): TSolverContextBase => {
	const {configuration} = useManageVaults();
	const {onRefresh} = useWallet();
	const {address, provider} = useWeb3();
	const [approvalStatus, set_approvalStatus] = useState(defaultTxStatus);
	const [depositStatus, set_depositStatus] = useState(defaultTxStatus);
	const [withdrawStatus, set_withdrawStatus] = useState(defaultTxStatus);
	const [allowance, set_allowance] = useState<TNormalizedBN>(zeroNormalizedBN);
	const [isFetchingAllowance, set_isFetchingAllowance] = useState(false);
	const [latestQuote, set_latestQuote] = useState<TPortalsEstimate>();
	const [isFetchingQuote, set_isFetchingQuote] = useState(false);
	const [canZap, set_canZap] = useState(true);
	const spendAmount = configuration?.tokenToSpend.amount?.raw ?? 0n;
	const isAboveAllowance = allowance.raw >= spendAmount;
	const existingAllowances = useRef<TDict<TNormalizedBN>>({});
	const slippage = 0.1;
	const [permitSignature, set_permitSignature] = useState<TPermitSignature | undefined>(undefined);

	/**********************************************************************************************
	 * TODO: Add comment to explain how it works
	 *********************************************************************************************/
	const onRetrieveQuote = useCallback(async () => {
		const {action} = configuration;
		if (
			!configuration?.vault ||
			(action === 'DEPOSIT' && !configuration.tokenToSpend.token) ||
			(action === 'DEPOSIT' && toBigInt(configuration.tokenToSpend.amount?.raw) === 0n) ||
			(action === 'WITHDRAW' && !configuration.tokenToReceive.token) ||
			(action === 'WITHDRAW' && toBigInt(configuration.tokenToSpend.amount?.raw) === 0n)
		) {
			set_latestQuote(undefined);
			return null;
		}

		const outputToken =
			action === 'DEPOSIT' ? configuration.vault.address : configuration.tokenToReceive.token?.address;
		const request: TInitSolverArgs = {
			chainID: Number(configuration?.tokenToSpend.token?.chainID),
			version: configuration?.vault.version,
			from: toAddress(address),
			inputToken: toAddress(configuration?.tokenToSpend.token?.address),
			outputToken: toAddress(outputToken),
			inputAmount: configuration?.tokenToSpend.amount?.raw ?? 0n,
			isDepositing: true,
			stakingPoolAddress: undefined
		};

		set_isFetchingQuote(true);
		const {result, error} = await getQuote(request, slippage);
		if (!result) {
			if (error) {
				console.error(error);
			}
			set_canZap(false);
			set_latestQuote(undefined);
			set_isFetchingQuote(false);
			return undefined;
		}
		set_canZap(true);
		set_latestQuote(result);
		set_isFetchingQuote(false);

		return result;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		address,
		configuration?.tokenToReceive.amount?.normalized,
		configuration?.tokenToSpend.token?.address,
		configuration?.tokenToReceive.token?.address,
		configuration?.tokenToSpend.amount?.normalized
	]);

	/**********************************************************************************************
	 * Retrieve the allowance for the token to be used by the solver. This will be used to
	 * determine if the user should approve the token or not.
	 *********************************************************************************************/
	const onRetrieveAllowance = useCallback(
		async (shouldForceRefetch?: boolean): Promise<TNormalizedBN> => {
			if (!latestQuote || !configuration?.tokenToSpend.token || !configuration?.tokenToReceive.token) {
				return zeroNormalizedBN;
			}
			if (configuration.tokenToSpend.amount === zeroNormalizedBN) {
				return zeroNormalizedBN;
			}

			const inputToken = configuration?.tokenToSpend.token.address;
			const outputToken = configuration?.tokenToReceive.token.address;

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
			configuration?.tokenToReceive.token,
			configuration.tokenToSpend.amount,
			configuration.tokenToSpend.token,
			latestQuote
		]
	);

	/**********************************************************************************************
	 * TODO: Add comment to explain how it works
	 *********************************************************************************************/
	useAsyncTrigger(async (): Promise<void> => {
		if (!configuration?.action) {
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
			return;
		}
		if (configuration.action === 'DEPOSIT') {
			onRetrieveQuote();
			return;
		}

		// set_permitSignature(undefined);
		// set_approvalStatus(defaultTxStatus);
		// set_depositStatus(defaultTxStatus);
		// set_withdrawStatus(defaultTxStatus);
		// set_allowance(await onRetrieveAllowance(false));
	}, [configuration.action, isZapNeededForDeposit, isZapNeededForWithdraw, onRetrieveQuote]);

	/**********************************************************************************************
	 * SWR hook to get the expected out for a given in/out pair with a specific amount. This hook
	 * is called when amount/in or out changes. Calls the allowanceFetcher callback.
	 *********************************************************************************************/
	const triggerRetreiveAllowance = useAsyncTrigger(async (): Promise<void> => {
		if (!configuration?.action) {
			return;
		}
		if (configuration.action === 'DEPOSIT' && !isZapNeededForDeposit) {
			return;
		}
		if (configuration.action === 'WITHDRAW' && !isZapNeededForWithdraw) {
			return;
		}
		set_allowance(await onRetrieveAllowance(true));
	}, [configuration.action, isZapNeededForDeposit, isZapNeededForWithdraw, onRetrieveAllowance]);

	/**********************************************************************************************
	 * Trigger an signature to approve the token to be used by the Portals
	 * solver. A single signature is required, which will allow the spending
	 * of the token by the Portals solver.
	 *********************************************************************************************/
	const onApprove = useCallback(
		async (onSuccess?: () => void): Promise<void> => {
			if (!provider) {
				return;
			}

			assert(configuration?.tokenToSpend.token, 'Input token is not set');
			assert(configuration?.tokenToSpend.amount, 'Input amount is not set');

			const shouldUsePermit = await isSupportingPermit({
				contractAddress: configuration?.tokenToSpend.token.address,
				chainID: Number(configuration?.vault?.chainID)
			});

			const config = configuration as TAssertedVaultsConfiguration;

			const amount = configuration?.tokenToSpend.amount.raw;

			try {
				if (shouldUsePermit) {
					const signature = await signPermit({
						contractAddress: config?.tokenToSpend.token.address,
						ownerAddress: toAddress(address),
						spenderAddress: toAddress(CHAINS[config.vault.chainID].yearnRouterAddress),
						value: config.tokenToSpend.amount?.raw ?? 0n,
						deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 60),
						chainID: config.vault.chainID
					});

					set_allowance(config.tokenToSpend.amount || zeroNormalizedBN);
					set_permitSignature(signature);
				} else {
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
							onSuccess?.();
						}
						triggerRetreiveAllowance();
						return;
					}
					onSuccess?.();
					triggerRetreiveAllowance();
					return;
				}
			} catch (error) {
				console.error(error);
				return;
			}
		},
		[address, configuration, provider, triggerRetreiveAllowance]
	);

	const onExecuteMulticall = useCallback(
		async (portalsCalldata: {
			target: TAddress;
			value: bigint;
			allowFailure: boolean;
			callData: TAddress;
		}): Promise<void> => {
			if (permitSignature) {
				const callDataPermitAllowance = {
					target: toAddress(configuration?.tokenToSpend.token?.address),
					value: configuration?.tokenToSpend.amount?.raw ?? 0n,
					allowFailure: false,
					callData: encodeFunctionData({
						abi: erc20AbiWithPermit,
						functionName: 'permit',
						args: [
							toAddress(address),
							portalsCalldata.target,
							configuration?.tokenToSpend.amount?.raw,
							permitSignature.deadline,
							permitSignature.v,
							permitSignature.r,
							permitSignature.s
						]
					})
				};

				const multicallData = [callDataPermitAllowance, portalsCalldata];

				console.log(multicallData);

				const result = await multicall({
					connector: provider,
					chainID: Number(configuration?.vault?.chainID),
					contractAddress: getNetwork(Number(configuration?.vault?.chainID)).contracts.multicall3?.address,
					multicallData: multicallData,
					statusHandler: set_depositStatus
				});

				if (result.isSuccessful) {
					await onRefresh(
						[
							{
								chainID: Number(configuration?.vault?.chainID),
								address: toAddress(configuration?.vault?.address)
							},
							{
								chainID: Number(configuration?.vault?.chainID),
								address: toAddress(configuration?.vault?.token.address)
							},
							{
								chainID: Number(configuration?.tokenToSpend.token?.chainID),
								address: toAddress(configuration?.tokenToSpend.token?.address)
							},
							{
								chainID: Number(configuration?.tokenToReceive.token?.chainID),
								address: toAddress(configuration?.tokenToReceive.token?.address)
							},
							{chainID: Number(configuration?.tokenToSpend.token?.chainID), address: ETH_TOKEN_ADDRESS}
						],
						false,
						true
					);
				}
			}
		},
		[
			address,
			configuration?.tokenToReceive.token?.address,
			configuration?.tokenToReceive.token?.chainID,
			configuration?.tokenToSpend.amount?.raw,
			configuration?.tokenToSpend.token?.address,
			configuration?.tokenToSpend.token?.chainID,
			configuration?.vault?.address,
			configuration?.vault?.chainID,
			configuration?.vault?.token.address,
			onRefresh,
			permitSignature,
			provider
		]
	);

	/**********************************************************************************************
	 * execute will send the post request to execute the order and wait for it to be executed, no
	 * matter the result. It returns a boolean value indicating whether the order was successful or
	 * not.
	 *********************************************************************************************/
	const execute = useCallback(
		async (action: 'WITHDRAW' | 'DEPOSIT'): Promise<TTxResponse> => {
			assert(provider, 'Provider is not set');
			assert(latestQuote, 'Quote is not set');
			assert(configuration?.tokenToSpend.token, 'Token to Spend is not set');
			assert(configuration?.tokenToReceive.token, 'Token to Receiver is not set');
			assert(configuration?.vault, 'Output token is not set');
			const tokenToSpend = configuration?.tokenToSpend.token;
			const amountToSpend = configuration?.tokenToSpend.amount;
			const tokenToReceive = configuration?.tokenToReceive.token;
			const vault = configuration?.vault;

			try {
				const wProvider = await toWagmiProvider(provider);

				/**********************************************************************************
				 ** Based on the flow of the transaction, we need to set the input token to the
				 ** token to spend, and the output token to the vault or the token to receive.
				 *********************************************************************************/
				let inputToken = tokenToSpend.address;
				const outputToken = action === 'DEPOSIT' ? vault.address : tokenToReceive.address;
				if (isEthAddress(inputToken)) {
					inputToken = zeroAddress;
				}

				/**********************************************************************************
				 ** We can ask the Portals solver to prepare the transaction for us. We need to
				 ** provide the sender, input token, output token, input amount, and slippage
				 ** tolerance.
				 *********************************************************************************/
				const network = PORTALS_NETWORK.get(tokenToSpend.chainID);
				const transaction = await getPortalsTx({
					params: {
						sender: toAddress(address),
						inputToken: `${network}:${toAddress(inputToken)}`,
						outputToken: `${network}:${toAddress(outputToken)}`,
						inputAmount: String(amountToSpend?.raw ?? 0n),
						slippageTolerancePercentage: slippage.toString(),
						validate: 'false'
					}
				});

				if (!transaction.result) {
					throw new Error('Transaction data was not fetched from Portals!');
				}
				const {tx} = transaction.result;
				const {value, to, data, ...rest} = tx;

				/**********************************************************************************
				 ** If the user tries to deposit or withdraw from a different chain than the one
				 ** the token is on, we need to switch the chain before performing the transaction.
				 *********************************************************************************/
				if (
					(action === 'DEPOSIT' && wProvider.chainId !== tokenToSpend.chainID) ||
					(action === 'WITHDRAW' && wProvider.chainId !== tokenToReceive.chainID)
				) {
					try {
						await switchChain(retrieveConfig(), {
							chainId: action === 'DEPOSIT' ? tokenToSpend.chainID : Number(tokenToReceive.chainID)
						});
					} catch (error) {
						if (!(error instanceof BaseError)) {
							return {isSuccessful: false, error};
						}
						console.error(error.shortMessage);

						return {isSuccessful: false, error};
					}
				}

				if (permitSignature) {
					onExecuteMulticall({
						target: toAddress(to),
						value: toBigInt(value ?? 0),
						allowFailure: false,
						callData: tx.data as TAddress
					});
				} else {
					/**********************************************************************************
					 ** We assert that the data is in hex format and that the wallet client is set
					 ** before sending the transaction prepared by the Portals solver.
					 ** Once it's done and we have the receipt, we need to update the balances of all
					 ** the tokens involved in the transaction
					 *********************************************************************************/
					assert(isHex(data), 'Data is not hex');
					assert(wProvider.walletClient, 'Wallet client is not set');
					const hash = await sendTransaction(retrieveConfig(), {
						value: toBigInt(value ?? 0),
						to: toAddress(to),
						data,
						chainId: tokenToSpend.chainID,
						// gas: 2000000,
						...rest
					});
					const receipt = await waitForTransactionReceipt(retrieveConfig(), {
						chainId: wProvider.chainId,
						hash
					});
					if (receipt.status === 'success') {
						return {isSuccessful: true, receipt: receipt};
					}
				}

				await onRefresh(
					[
						{chainID: vault.chainID, address: vault.address},
						{chainID: vault.chainID, address: vault.token.address},
						{chainID: tokenToSpend.chainID, address: tokenToSpend.address},
						{chainID: tokenToReceive.chainID, address: tokenToReceive.address},
						{chainID: tokenToSpend.chainID, address: ETH_TOKEN_ADDRESS}
					],
					false,
					true
				);

				console.error('Fail to perform transaction');
				return {isSuccessful: false};
			} catch (error) {
				if (isValidPortalsErrorObject(error)) {
					const errorMessage = error.response.data.message;
					console.dir(errorMessage);
				} else {
					console.dir(error);
				}

				return {isSuccessful: false};
			}
		},
		[
			address,
			configuration?.tokenToReceive.token,
			configuration?.tokenToSpend.amount,
			configuration?.tokenToSpend.token,
			configuration?.vault,
			latestQuote,
			onExecuteMulticall,
			onRefresh,
			permitSignature,
			provider
		]
	);

	/**********************************************************************************************
	 ** This execute function is not an actual deposit/withdraw, but a swap using the Portals
	 ** solver. The deposit will be executed by the Portals solver by simply swapping the input
	 ** token for the output token.
	 *********************************************************************************************/
	const onExecuteDeposit = useCallback(
		async (onSuccess: () => void): Promise<void> => {
			assert(provider, 'Provider is not set');

			set_depositStatus({...defaultTxStatus, pending: true});
			const status = await execute('DEPOSIT');
			if (status.isSuccessful) {
				set_depositStatus({...defaultTxStatus, success: true});
				onSuccess();
			} else {
				set_depositStatus({...defaultTxStatus, error: true});
			}
		},
		[execute, provider]
	);

	const onExecuteWithdraw = useCallback(
		async (onSuccess: () => void): Promise<void> => {
			assert(provider, 'Provider is not set');

			set_withdrawStatus({...defaultTxStatus, pending: true});
			const status = await execute('WITHDRAW');
			if (status.isSuccessful) {
				set_withdrawStatus({...defaultTxStatus, success: true});
				onSuccess();
			} else {
				set_withdrawStatus({...defaultTxStatus, error: true});
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

		/** Withdraw part */
		withdrawStatus,
		set_withdrawStatus,
		onExecuteWithdraw,

		canZap,
		isFetchingQuote,
		quote: latestQuote || null
	};
};
