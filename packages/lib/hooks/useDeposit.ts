import {useCallback, useMemo, useState} from 'react';
import {encodeFunctionData, erc20Abi, erc4626Abi, maxUint256} from 'viem';
import {useBlockNumber, useReadContract} from 'wagmi';
import {useSafeAppsSDK} from '@gnosis.pm/safe-apps-react-sdk';
import {readContract} from '@wagmi/core';

import {useWeb3} from '../contexts/useWeb3';
import {encodeFunctionCall, isAddress, isEthAddress, isZeroAddress, toAddress} from '../utils';
import {erc4626RouterAbi} from '../utils/abi/4626Router.abi';
import {vaultAbi} from '../utils/abi/vaultV2.abi';
import {depositTo4626VaultViaRouter, depositToVault, retrieveConfig, toWagmiProvider} from '../utils/wagmi';
import {toBigInt} from './../utils/format';

import type {BaseError, Hex, TransactionReceipt} from 'viem';
import type {TAddress} from '../types';
import type {TPermitSignature} from './usePermit.types';

type TUseDepositArgsBase = {
	tokenToDeposit: TAddress;
	vault: TAddress;
	owner: TAddress;
	receiver?: TAddress;
	amountToDeposit: bigint;
	chainID: number;
	disabled?: boolean;
};

type TUseDepositArgsLegacy = TUseDepositArgsBase & {
	version: 'LEGACY';
	options?: {
		disableSafeBatch?: boolean;
	};
};

type TUseDepositArgsERC4626 = TUseDepositArgsBase & {
	version: 'ERC-4626';
	options?: {
		disableSafeBatch?: boolean;
		useRouter: boolean;
		routerAddress: TAddress;
		minOutSlippage: bigint;
		permitSignature?: TPermitSignature;
	};
};

type TUseDepositArgs = TUseDepositArgsLegacy | TUseDepositArgsERC4626;

type TUseDepositResp = {
	maxDepositForUser: bigint; // Maximum amount that can be deposited by the user
	canDeposit: boolean; // If the token can be deposited`
	isDepositing: boolean; // If the approval is in progress
	onDeposit: (
		onSuccess?: (receipt?: TransactionReceipt) => void,
		onFailure?: (errorMessage?: string) => void
	) => Promise<boolean>; // Function to deposit the token
};

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
export function useVaultDeposit(args: TUseDepositArgs): TUseDepositResp {
	const {sdk} = useSafeAppsSDK();
	const {provider, isWalletSafe} = useWeb3();
	const [isDepositing, set_isDepositing] = useState(false);

	const {data: blockNumber} = useBlockNumber();

	/**********************************************************************************************
	 ** The ERC-4626 version of the vaults has a method called maxDeposit: this function returns
	 ** the maximum amount of underlying assets that can be deposited in a single deposit call by
	 ** the receiver.
	 ** We need this to be able to indicate to the user the maximum amount of tokens that can be
	 ** deposited.
	 *********************************************************************************************/
	const {data: maxDepositForUser, refetch: refetchMaxDepositForUser} = useReadContract({
		address: args.vault,
		abi: erc4626Abi,
		functionName: 'maxDeposit',
		args: [args.owner],
		chainId: args.chainID,
		query: {
			enabled: isAddress(args.owner) && args.version === 'ERC-4626' && !args.disabled
		}
	});

	/**********************************************************************************************
	 ** The ERC-4626 version of the vaults has a method called previewDeposit: this function allows
	 ** users to simulate the effects of their deposit at the current block.
	 ** We will used that as an `expectedOut` value.
	 *********************************************************************************************/
	const {data: previewDeposit} = useReadContract({
		address: args.vault,
		abi: erc4626Abi,
		functionName: 'previewDeposit',
		args: [args.amountToDeposit],
		chainId: args.chainID,
		query: {
			enabled: args.version === 'ERC-4626' && !args.disabled
		}
	});

	/**********************************************************************************************
	 ** The LEGACY version of the vaults has a method called availableDepositLimit: this function
	 ** returns the maximum amount of underlying assets remaining to be deposited in the vault.
	 ** We need this to be able to indicate to the user the maximum amount of tokens that can be
	 ** deposited.
	 *********************************************************************************************/
	const {data: availableDepositLimit} = useReadContract({
		address: args.vault,
		abi: vaultAbi,
		functionName: 'availableDepositLimit',
		args: [],
		chainId: args.chainID,
		query: {
			enabled: args.version === 'LEGACY' && !args.disabled
		}
	});

	/**********************************************************************************************
	 ** canDeposit is a boolean that is true if the token can be deposited. It can be deposited if
	 ** the following conditions are met:
	 ** 1. args.tokenToDeposit is a valid address
	 ** 2. args.vault is a valid address
	 ** 3. args.amountToDeposit is greater than 0
	 ** 4. maxDepositForUser is defined and greater than or equal to args.amountToDeposit
	 ** 5. previewDeposit is defined and greater than 0
	 *********************************************************************************************/
	const canDeposit = useMemo(() => {
		if (isEthAddress(args.tokenToDeposit)) {
			return false;
		}

		if (args.version === 'LEGACY') {
			return Boolean(
				isAddress(args.tokenToDeposit) &&
					isAddress(args.vault) &&
					args.amountToDeposit > 0n &&
					availableDepositLimit &&
					availableDepositLimit >= args.amountToDeposit
			);
		}

		// If the tokenToDeposit is not a valid address
		// If the vault is not a valid address
		// Then FALSE
		if (!isAddress(args.tokenToDeposit) || !isAddress(args.vault)) {
			return false;
		}

		// If the amountToDeposit is less than or equal to 0
		// Then FALSE
		if (args.amountToDeposit <= 0n) {
			return false;
		}

		// If the amountToDeposit is more than the maxDepositForUser
		// Then FALSE
		if (args.amountToDeposit > toBigInt(maxDepositForUser)) {
			return false;
		}
		return Boolean(previewDeposit && toBigInt(previewDeposit) > 0n);
	}, [
		args.version,
		args.tokenToDeposit,
		args.vault,
		args.amountToDeposit,
		maxDepositForUser,
		previewDeposit,
		availableDepositLimit
	]);

	/**********************************************************************************************
	 ** onDeposit is a function that is called to deposit the token. It takes two optional
	 ** arguments:
	 ** 1. onSuccess: A function that is called when the approval is successful
	 ** 2. onFailure: A function that is called when the approval fails
	 **
	 ** The function behaves differently based on the options passed in the args, aka if the user
	 ** wants to use a router or not.
	 *********************************************************************************************/
	const onDeposit = useCallback(
		async (
			onSuccess?: (receipt?: TransactionReceipt) => void,
			onFailure?: (errorMessage?: string) => void
		): Promise<boolean> => {
			if (!canDeposit) {
				return false;
			}
			set_isDepositing(true);

			/**********************************************************************************************
			 ** If we are dealing with a Safe, then we need to use the Safe SDK to perform the deposit with
			 ** the batch transaction.
			 *********************************************************************************************/
			if (isWalletSafe && !args.options?.disableSafeBatch) {
				let safeTransactionResult;
				const batch = [];
				if (!isZeroAddress(args.tokenToDeposit)) {
					batch.push(
						encodeFunctionCall({
							to: args.tokenToDeposit,
							value: 0n,
							abi: erc20Abi,
							functionName: 'approve',
							args: [toAddress(args.vault), toBigInt(args.amountToDeposit)]
						})
					);
				}
				batch.push(
					encodeFunctionCall({
						to: args.vault,
						value: 0n,
						abi: vaultAbi,
						functionName: 'deposit',
						args: [toBigInt(args.amountToDeposit), isAddress(args.receiver) ? args.receiver : args.owner]
					})
				);

				try {
					const res = await sdk.txs.send({txs: batch});
					do {
						safeTransactionResult = await sdk.txs.getBySafeTxHash((await res).safeTxHash);
						await new Promise(resolve => setTimeout(resolve, 30_000));
					} while (
						safeTransactionResult.txStatus !== 'SUCCESS' &&
						safeTransactionResult.txStatus !== 'FAILED' &&
						safeTransactionResult.txStatus !== 'CANCELLED'
					);

					if (safeTransactionResult.txStatus === 'SUCCESS') {
						const receipt: TransactionReceipt = {
							transactionHash: res.safeTxHash as Hex,
							transactionIndex: -1, // Placeholder since Safe tx doesn't have these
							blockHash: '0x0', // Placeholder since Safe tx doesn't have these
							blockNumber: blockNumber || 0n,
							contractAddress: null,
							cumulativeGasUsed: 0n, // Placeholder since Safe tx doesn't have these
							effectiveGasPrice: 0n, // Placeholder since Safe tx doesn't have these
							from: toAddress(args.owner),
							gasUsed: 0n, // Placeholder since Safe tx doesn't have these
							logs: [], // Placeholder since Safe tx doesn't have these
							logsBloom: '0x0', // Placeholder since Safe tx doesn't have these
							status: 'success',
							to: toAddress(args.vault),
							type: 'legacy' // Placeholder since Safe tx doesn't have these
						};
						onSuccess?.(receipt);
					} else {
						onFailure?.('Error while creating safe batch');
					}
				} catch (err) {
					console.error(err);
					onFailure?.('Error while creating safe batch');
				} finally {
					set_isDepositing(false);
				}
				return safeTransactionResult?.txStatus === 'SUCCESS';
			}

			const wagmiProvider = await toWagmiProvider(provider);
			if (!wagmiProvider || !isAddress(wagmiProvider.address)) {
				set_isDepositing(false);
				return false;
			}

			/**********************************************************************************************
			 ** If the version is LEGACY, then we can directly deposit the token into the vault. We cannot
			 ** use fancy stuff like permit or router.
			 *********************************************************************************************/
			if (args.version === 'LEGACY') {
				const result = await depositToVault({
					connector: provider,
					chainID: args.chainID,
					contractAddress: args.vault,
					receiver: isAddress(args.receiver) ? args.receiver : args.owner,
					amount: args.amountToDeposit
				});
				if (result.isSuccessful) {
					onSuccess?.(result.receipt);
				} else {
					const errorMessage =
						(result.error as BaseError).message ||
						(result.error as BaseError).shortMessage ||
						(result.error as BaseError).details;
					onFailure?.(errorMessage || 'Unknown Error');
				}
				set_isDepositing(false);
				return result.isSuccessful;
			}

			/**********************************************************************************************
			 ** This flow is specific and used only for the Yearn vaults that are using the ERC-4626 (for
			 ** now). The goal is to be able to perform some non-standard operations like permit or
			 ** depositing via a router.
			 ** Documentation about the router can be found here:
			 ** https://github.com/yearn/Yearn-ERC4626-Router
			 *********************************************************************************************/
			if (args.options) {
				if (args.options.minOutSlippage < 0n || args.options.minOutSlippage > 10000n) {
					throw new Error('Invalid minOutSlippage');
				}
				if (!isAddress(args.options.routerAddress)) {
					throw new Error('Invalid router address');
				}
				const multicalls = [];
				const minShareOut = (toBigInt(previewDeposit) * (10000n - args.options.minOutSlippage)) / 10000n;

				/**********************************************************************************************
				 ** We need to make sure that the Vault can spend the Underlying Token owned by the router.
				 ** This is a bit weird and only need to be done once, but hey, this is required.
				 *********************************************************************************************/
				const allowance = await readContract(retrieveConfig(), {
					address: args.tokenToDeposit,
					chainId: args.chainID,
					abi: erc20Abi,
					functionName: 'allowance',
					args: [args.options.routerAddress, args.vault]
				});
				if (toBigInt(allowance) < maxUint256) {
					multicalls.push(
						encodeFunctionData({
							abi: erc4626RouterAbi,
							functionName: 'approve',
							args: [args.tokenToDeposit, args.vault, maxUint256]
						})
					);
				}

				/**********************************************************************************************
				 ** Then we can prepare our multicall
				 *********************************************************************************************/
				if (args.options.permitSignature) {
					multicalls.push(
						encodeFunctionData({
							abi: erc4626RouterAbi,
							functionName: 'selfPermit',
							args: [
								toAddress(args.tokenToDeposit),
								toBigInt(args.amountToDeposit),
								args.options.permitSignature.deadline,
								args.options.permitSignature.v,
								args.options.permitSignature.r,
								args.options.permitSignature.s
							]
						})
					);
				}
				multicalls.push(
					encodeFunctionData({
						abi: erc4626RouterAbi,
						functionName: 'depositToVault',
						args: [
							args.vault,
							args.amountToDeposit,
							isAddress(args.receiver) ? args.receiver : args.owner,
							minShareOut
						]
					})
				);
				const result = await depositTo4626VaultViaRouter({
					connector: provider,
					chainID: args.chainID,
					contractAddress: args.options.routerAddress,
					multicalls
				});
				if (result.isSuccessful) {
					onSuccess?.(result.receipt);
				} else {
					const errorMessage =
						(result.error as BaseError).message ||
						(result.error as BaseError).shortMessage ||
						(result.error as BaseError).details;
					onFailure?.(errorMessage || 'Unknown Error');
				}
				await refetchMaxDepositForUser();
				set_isDepositing(false);
				return result.isSuccessful;
			}

			const result = await depositToVault({
				connector: provider,
				chainID: args.chainID,
				contractAddress: args.vault,
				receiver: isAddress(args.receiver) ? args.receiver : args.owner,
				amount: args.amountToDeposit
			});
			if (result.isSuccessful) {
				onSuccess?.(result.receipt);
			} else {
				const errorMessage =
					(result.error as BaseError).message ||
					(result.error as BaseError).shortMessage ||
					(result.error as BaseError).details;
				onFailure?.(errorMessage || 'Unknown Error');
			}
			await refetchMaxDepositForUser();
			set_isDepositing(false);
			return result.isSuccessful;
		},
		[
			canDeposit,
			isWalletSafe,
			args.options,
			args.version,
			args.chainID,
			args.vault,
			args.receiver,
			args.owner,
			args.amountToDeposit,
			args.tokenToDeposit,
			provider,
			refetchMaxDepositForUser,
			sdk.txs,
			blockNumber,
			previewDeposit
		]
	);

	return {
		maxDepositForUser: toBigInt(maxDepositForUser),
		canDeposit,
		isDepositing,
		onDeposit
	};
}
