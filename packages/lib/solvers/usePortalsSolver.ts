import {useCallback, useState} from 'react';
import toast from 'react-hot-toast';
import {BaseError, isHex, zeroAddress} from 'viem';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useApprove} from '@builtbymom/web3/hooks/useApprove';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {assert, ETH_TOKEN_ADDRESS, isEthAddress, isZeroAddress, toAddress, toBigInt} from '@builtbymom/web3/utils';
import {defaultTxStatus, retrieveConfig, toWagmiProvider} from '@builtbymom/web3/utils/wagmi';
import {useSafeAppsSDK} from '@gnosis.pm/safe-apps-react-sdk';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {getPortalsApproval, getPortalsTx, getQuote, PORTALS_NETWORK} from '@lib/utils/api.portals';
import {isValidPortalsErrorObject} from '@lib/utils/isValidPortalsErrorObject';
import {getApproveTransaction} from '@lib/utils/tools.gnosis';
import {sendTransaction, switchChain, waitForTransactionReceipt} from '@wagmi/core';

import type {TTxResponse} from '@builtbymom/web3/utils/wagmi';
import type {BaseTransaction} from '@gnosis.pm/safe-apps-sdk';
import type {TSolverContextBase} from '@lib/contexts/useSolver';
import type {TPortalsApproval, TPortalsEstimate} from '@lib/utils/api.portals';
import type {TInitSolverArgs} from '@lib/utils/solvers';

export const usePortalsSolver = (
	isZapNeededForDeposit: boolean,
	isZapNeededForWithdraw: boolean
): TSolverContextBase => {
	const {configuration} = useManageVaults();
	const {onRefresh} = useWallet();
	const {address, provider, isWalletSafe} = useWeb3();
	const {sdk} = useSafeAppsSDK();
	const [depositStatus, set_depositStatus] = useState(defaultTxStatus);
	const [withdrawStatus, set_withdrawStatus] = useState(defaultTxStatus);
	const [latestQuote, set_latestQuote] = useState<TPortalsEstimate>();
	const [isFetchingQuote, set_isFetchingQuote] = useState(false);
	const [canZap, set_canZap] = useState(true);
	const [approveCtx, set_approveCtx] = useState<TPortalsApproval>();
	const slippage = 0.1;

	/**********************************************************************************************
	 * TODO: Add comment to explain how it works
	 *********************************************************************************************/
	useAsyncTrigger(async (): Promise<void> => {
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
				inputAmount: toBigInt(configuration?.tokenToSpend.amount.raw).toString(),
				permitDeadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 60).toString()
			}
		});

		if (!approval) {
			set_approveCtx(undefined);
			return;
		}
		set_approveCtx(approval);
	}, [
		address,
		approveCtx?.context.target,
		configuration?.tokenToSpend?.amount?.raw,
		configuration?.tokenToSpend.token,
		configuration?.vault?.address
	]);

	/**********************************************************************************************
	 ** The useApprove hook is used to approve the token to spend for the vault. This is used to
	 ** allow the vault to spend the token on behalf of the user. This is required for the deposit
	 ** function to work.
	 *********************************************************************************************/
	const {isApproved, isApproving, onApprove, amountApproved, permitSignature, onClearPermit} = useApprove({
		provider,
		chainID: configuration?.vault?.chainID || 0,
		tokenToApprove: toAddress(configuration?.tokenToSpend.token?.address),
		spender: toAddress(approveCtx?.context.spender || zeroAddress),
		owner: toAddress(address),
		amountToApprove: toBigInt(configuration?.tokenToSpend.amount?.raw || 0n),
		shouldUsePermit: approveCtx?.context.canPermit || false,
		deadline: 60
	});

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
	 ** SWR hook to get the expected out for a given in/out pair with a specific amount. This hook
	 ** is called when amount/in or out changes. Calls the allowanceFetcher callback.
	 ** Note: we also clear the permit signature because this means that the user has changed the
	 ** amount or the token to spend.
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
		}
		if (configuration.action === 'DEPOSIT') {
			onRetrieveQuote();
		}
		set_depositStatus(defaultTxStatus);
		set_withdrawStatus(defaultTxStatus);
	}, [configuration.action, isZapNeededForDeposit, isZapNeededForWithdraw, onRetrieveQuote]);

	/**********************************************************************************************
	 * TODO: Add comment to explain how it works
	 *********************************************************************************************/
	const onDepositForGnosis = useCallback(
		async (onSuccess?: () => void): Promise<void> => {
			assert(provider, 'Provider is not set');
			assert(latestQuote, 'Quote is not set');
			assert(configuration?.tokenToSpend.token, 'Token to Spend is not set');
			assert(configuration?.tokenToReceive.token, 'Token to Receiver is not set');
			assert(configuration?.vault, 'Output token is not set');

			const tokenToSpend = configuration?.tokenToSpend.token;
			const tokenToReceive = configuration?.tokenToReceive.token;
			const amountToSpend = configuration?.tokenToSpend.amount;

			let inputToken = tokenToSpend.address;
			const outputToken =
				configuration?.action === 'DEPOSIT' ? configuration?.vault.address : tokenToReceive.address;
			if (isEthAddress(inputToken)) {
				inputToken = zeroAddress;
			}

			const network = PORTALS_NETWORK.get(tokenToSpend.chainID);
			const transaction = await getPortalsTx({
				params: {
					sender: toAddress(address),
					inputToken: `${network}:${toAddress(inputToken)}`,
					outputToken: `${network}:${toAddress(outputToken)}`,
					inputAmount: String(amountToSpend?.raw ?? 0n),
					slippageTolerancePercentage: slippage.toString(),
					validate: 'true'
				}
			});

			if (!transaction.result) {
				throw new Error('Transaction data was not fetched from Portals!');
			}

			const {
				tx: {value, to, data}
			} = transaction.result;

			const batch = [];

			if (!isZeroAddress(inputToken)) {
				const approveTransactionForBatch = getApproveTransaction(
					toBigInt(configuration?.tokenToSpend.amount?.raw).toString(),
					toAddress(configuration?.tokenToSpend.token.address),
					toAddress(to)
				);

				batch.push(approveTransactionForBatch);
			}

			const portalsTransactionForBatch: BaseTransaction = {
				to: toAddress(to),
				value: toBigInt(value ?? 0n).toString(),
				data
			};

			batch.push(portalsTransactionForBatch);

			try {
				const res = sdk.txs.send({txs: batch});
				let result;
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
						{chainID: configuration?.vault.chainID, address: configuration?.vault.address},
						{chainID: configuration?.vault.chainID, address: configuration?.vault.token.address},
						{chainID: tokenToSpend.chainID, address: tokenToSpend.address},
						{chainID: tokenToReceive.chainID, address: tokenToReceive.address},
						{chainID: tokenToSpend.chainID, address: ETH_TOKEN_ADDRESS}
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
			configuration?.action,
			configuration?.tokenToReceive.token,
			configuration?.tokenToSpend.amount,
			configuration?.tokenToSpend.token,
			configuration?.vault,
			latestQuote,
			provider,
			onRefresh,
			sdk.txs
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
						validate: isWalletSafe ? 'false' : 'true',
						permitSignature: permitSignature?.signature || undefined,
						permitDeadline: permitSignature?.deadline ? permitSignature.deadline.toString() : undefined
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
					return {isSuccessful: true, receipt: receipt};
				}

				console.error('Fail to perform transaction');
				return {isSuccessful: false};
			} catch (error) {
				if (isValidPortalsErrorObject(error)) {
					const errorMessage = error.response.data.message;
					toast.error(errorMessage);
					console.error(errorMessage);
				} else {
					toast.error(
						(error as BaseError).shortMessage || 'An error occured while creating your transaction!'
					);
					console.error(error);
				}

				return {isSuccessful: false};
			} finally {
				onClearPermit();
			}
		},
		[
			address,
			configuration?.tokenToReceive.token,
			configuration?.tokenToSpend.amount,
			configuration?.tokenToSpend.token,
			configuration?.vault,
			isWalletSafe,
			latestQuote,
			onClearPermit,
			onRefresh,
			permitSignature?.deadline,
			permitSignature?.signature,
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
		onDepositForGnosis,

		/** Approval part */
		onApprove,
		allowance: amountApproved,
		permitSignature,
		isApproving,
		isApproved,

		/** Withdraw part */
		withdrawStatus,
		set_withdrawStatus,
		onExecuteWithdraw,

		canZap,
		isFetchingQuote,
		quote: latestQuote || null
	};
};
