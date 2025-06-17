import {useCallback, useMemo, useState} from 'react';
import toast from 'react-hot-toast';
import {BaseError, isHex, zeroAddress} from 'viem';
import {useReadContract} from 'wagmi';
import {useSafeAppsSDK} from '@gnosis.pm/safe-apps-react-sdk';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import useWallet from '@lib/contexts/useWallet';
import {useWeb3} from '@lib/contexts/useWeb3';
import {useApprove} from '@lib/hooks/useApprove';
import {useAsyncTrigger} from '@lib/hooks/useAsyncTrigger';
import {assert, ETH_TOKEN_ADDRESS, isEthAddress, isZeroAddress, toAddress, toBigInt} from '@lib/utils';
import {getPortalsApproval, getPortalsTx, getQuote, PORTALS_NETWORK} from '@lib/utils/api.portals';
import {isValidPortalsErrorObject} from '@lib/utils/isValidPortalsErrorObject';
import {getApproveTransaction} from '@lib/utils/tools.gnosis';
import {VAULT_ABI} from '@lib/utils/vault.abi';
import {defaultTxStatus, retrieveConfig, toWagmiProvider} from '@lib/utils/wagmi';
import {sendTransaction, switchChain, waitForTransactionReceipt} from '@wagmi/core';

import type {BaseTransaction} from '@gnosis.pm/safe-apps-sdk';
import type {TSolverContextBase} from '@lib/contexts/useSolver';
import type {TPortalsApproval, TPortalsEstimate} from '@lib/utils/api.portals';
import type {TInitSolverArgs} from '@lib/utils/solvers';
import type {TTxResponse} from '@lib/utils/wagmi';

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
	const slippage = 0.25;
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
	const {data: amountToWithdraw} = useReadContract({
		address: configuration.vault?.address,
		abi: VAULT_ABI,
		functionName: 'convertToShares',
		args: [toBigInt(configuration?.tokenToSpend.amount?.raw)],
		chainId: configuration.vault?.chainID,
		query: {
			enabled:
				Boolean(configuration.vault) &&
				Boolean(configuration.tokenToSpend.token) &&
				isV3Vault &&
				configuration.action === 'WITHDRAW' &&
				isSolverEnabled
		}
	});
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
		amountToApprove: toBigInt(configuration?.tokenToSpend.amount?.raw || 0n),
		shouldUsePermit: (approveCtx?.context.canPermit || false) && !isLegacyVault,
		deadline: 60,
		disabled: !isSolverEnabled
	});

	/**********************************************************************************************
	 * Find the approve context to find the approve spender
	 * TODO: improve comment
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
		isSolverEnabled,
		approveCtx?.context.target,
		configuration?.tokenToSpend?.amount?.raw,
		configuration?.tokenToSpend.token,
		configuration?.vault?.address
	]);

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

		let request: TInitSolverArgs = {} as TInitSolverArgs;
		if (action === 'DEPOSIT') {
			request = {
				chainID: Number(configuration?.tokenToSpend.token?.chainID),
				version: configuration?.vault.version,
				from: toAddress(address),
				inputToken: toAddress(configuration?.tokenToSpend.token?.address),
				outputToken: toAddress(configuration.vault.address),
				inputAmount: toBigInt(configuration?.tokenToSpend.amount?.raw),
				isDepositing: true,
				stakingPoolAddress: undefined
			};
		} else {
			const initialAmount = toBigInt(configuration?.tokenToSpend.amount?.raw);
			const decimals = configuration?.tokenToSpend.token?.decimals || 18;
			const amountToUse = isV3Vault
				? toBigInt(isZapingBalance ? shareOf : amountToWithdraw)
				: toBigInt((initialAmount / toBigInt(pricePerShare)) * 10n ** toBigInt(decimals));
			request = {
				chainID: Number(configuration?.tokenToSpend.token?.chainID),
				version: configuration?.vault.version,
				from: toAddress(address),
				inputToken: toAddress(configuration?.tokenToSpend.token?.address),
				outputToken: toAddress(configuration.tokenToReceive.token?.address),
				inputAmount: amountToUse,
				isDepositing: true,
				stakingPoolAddress: undefined
			};
		}

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
	}, [configuration, address, isV3Vault, isZapingBalance, shareOf, amountToWithdraw, pricePerShare]);

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
		set_depositStatus(defaultTxStatus);
		set_withdrawStatus(defaultTxStatus);
	}, [configuration.action, isZapNeededForDeposit, isZapNeededForWithdraw, onRetrieveQuote, isSolverEnabled]);

	/**********************************************************************************************
	 * TODO: Add comment to explain how it works
	 *********************************************************************************************/
	const onExecuteForGnosis = useCallback(async (): Promise<boolean> => {
		assert(provider, 'Provider is not set');
		assert(latestQuote, 'Quote is not set');
		assert(configuration?.tokenToSpend.token, 'Token to Spend is not set');
		assert(configuration?.tokenToReceive.token, 'Token to Receiver is not set');
		assert(configuration?.vault, 'Output token is not set');

		const tokenToSpend = configuration?.tokenToSpend.token;
		const tokenToReceive = configuration?.tokenToReceive.token;
		let amountToSpend = configuration?.tokenToSpend.amount?.raw;

		if (configuration.action !== 'DEPOSIT') {
			const initialAmount = toBigInt(configuration?.tokenToSpend.amount?.raw);
			const decimals = configuration?.tokenToSpend.token?.decimals || 18;
			amountToSpend = isV3Vault
				? toBigInt(isZapingBalance ? shareOf : amountToWithdraw)
				: toBigInt((initialAmount / toBigInt(pricePerShare)) * 10n ** toBigInt(decimals));
		}

		let inputToken = tokenToSpend.address;
		const outputToken = configuration?.action === 'DEPOSIT' ? configuration?.vault.address : tokenToReceive.address;
		if (isEthAddress(inputToken)) {
			inputToken = zeroAddress;
		}

		const network = PORTALS_NETWORK.get(tokenToSpend.chainID);
		const transaction = await getPortalsTx({
			params: {
				sender: toAddress(address),
				inputToken: `${network}:${toAddress(inputToken)}`,
				outputToken: `${network}:${toAddress(outputToken)}`,
				inputAmount: toBigInt(amountToSpend).toString(),
				slippageTolerancePercentage: slippage.toString(),
				validate: isWalletSafe ? 'false' : 'true'
			}
		});

		if (!transaction.result) {
			console.error(new Error('Transaction data was not fetched from Portals!'));
			return false;
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

		let result;
		try {
			const res = sdk.txs.send({txs: batch});
			do {
				result = await sdk.txs.getBySafeTxHash((await res).safeTxHash);
				await new Promise(resolve => setTimeout(resolve, 30_000));
			} while (result.txStatus !== 'SUCCESS' && result.txStatus !== 'FAILED' && result.txStatus !== 'CANCELLED');
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
		return result?.txStatus === 'SUCCESS';
	}, [
		provider,
		latestQuote,
		configuration?.tokenToSpend.token,
		configuration?.tokenToSpend.amount?.raw,
		configuration?.tokenToReceive.token,
		configuration?.vault,
		configuration.action,
		address,
		isWalletSafe,
		isV3Vault,
		isZapingBalance,
		shareOf,
		amountToWithdraw,
		pricePerShare,
		sdk.txs,
		onRefresh
	]);

	/**********************************************************************************************
	 * execute will send the post request to execute the order and wait for it to be executed, no
	 * matter the result. It returns a boolean value indicating whether the order was successful or
	 * not.
	 *********************************************************************************************/
	const execute = useCallback(async (): Promise<TTxResponse> => {
		assert(provider, 'Provider is not set');
		assert(latestQuote, 'Quote is not set');
		assert(configuration?.tokenToSpend.token, 'Token to Spend is not set');
		assert(configuration?.tokenToReceive.token, 'Token to Receiver is not set');
		assert(configuration?.vault, 'Output token is not set');
		const tokenToSpend = configuration?.tokenToSpend.token;
		const tokenToReceive = configuration?.tokenToReceive.token;
		const vault = configuration?.vault;
		let amountToSpend = configuration?.tokenToSpend.amount?.raw;

		if (configuration?.action !== 'DEPOSIT') {
			const initialAmount = toBigInt(configuration?.tokenToSpend.amount?.raw);
			const decimals = configuration?.tokenToSpend.token?.decimals || 18;
			amountToSpend = isV3Vault
				? toBigInt(isZapingBalance ? shareOf : amountToWithdraw)
				: toBigInt((initialAmount / toBigInt(pricePerShare)) * 10n ** toBigInt(decimals));
		}

		try {
			const wProvider = await toWagmiProvider(provider);

			/**********************************************************************************
			 ** Based on the flow of the transaction, we need to set the input token to the
			 ** token to spend, and the output token to the vault or the token to receive.
			 *********************************************************************************/
			let inputToken = tokenToSpend.address;
			const outputToken = configuration?.action === 'DEPOSIT' ? vault.address : tokenToReceive.address;
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
					inputAmount: toBigInt(amountToSpend).toString(),
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
				(configuration?.action === 'DEPOSIT' && wProvider.chainId !== tokenToSpend.chainID) ||
				(configuration?.action === 'WITHDRAW' && wProvider.chainId !== tokenToReceive.chainID)
			) {
				try {
					await switchChain(retrieveConfig(), {
						chainId:
							configuration?.action === 'DEPOSIT' ? tokenToSpend.chainID : Number(tokenToReceive.chainID)
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
				// gas: 20000000n,
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
				toast.error((error as BaseError).shortMessage || 'An error occured while creating your transaction!');
				console.error(error);
			}

			return {isSuccessful: false};
		} finally {
			onClearPermit();
		}
	}, [
		address,
		amountToWithdraw,
		configuration?.action,
		configuration?.tokenToReceive.token,
		configuration?.tokenToSpend.amount?.raw,
		configuration?.tokenToSpend.token,
		configuration?.vault,
		isV3Vault,
		isWalletSafe,
		isZapingBalance,
		latestQuote,
		onClearPermit,
		onRefresh,
		permitSignature?.deadline,
		permitSignature?.signature,
		pricePerShare,
		provider,
		shareOf
	]);

	/**********************************************************************************************
	 ** This execute function is not an actual deposit/withdraw, but a swap using the Portals
	 ** solver. The deposit will be executed by the Portals solver by simply swapping the input
	 ** token for the output token.
	 *********************************************************************************************/
	const onExecuteDeposit = useCallback(async (): Promise<boolean> => {
		assert(provider, 'Provider is not set');

		if (isWalletSafe) {
			return await onExecuteForGnosis();
		}

		set_depositStatus({...defaultTxStatus, pending: true});
		const status = await execute();
		set_depositStatus({...defaultTxStatus, success: status.isSuccessful});
		return status.isSuccessful;
	}, [execute, isWalletSafe, onExecuteForGnosis, provider]);

	const onExecuteWithdraw = useCallback(async (): Promise<boolean> => {
		assert(provider, 'Provider is not set');

		if (isWalletSafe) {
			return await onExecuteForGnosis();
		}

		set_withdrawStatus({...defaultTxStatus, pending: true});
		const status = await execute();
		set_withdrawStatus({...defaultTxStatus, success: status.isSuccessful});
		return status.isSuccessful;
	}, [execute, isWalletSafe, onExecuteForGnosis, provider]);

	return {
		isApproved,
		isApproving,
		canDeposit: isApproved && !isApproving && !isFetchingQuote && canZap,
		isDepositing: depositStatus.pending,
		allowance: amountApproved,
		permitSignature,
		onApprove,
		onDeposit: onExecuteDeposit,
		onWithdraw: onExecuteWithdraw,
		isWithdrawing: withdrawStatus.pending,
		canZap,
		isFetchingQuote,
		quote: latestQuote || null,
		maxWithdraw: 0n,
		vaultBalanceOf: toBigInt(balanceOf)
	};
};
