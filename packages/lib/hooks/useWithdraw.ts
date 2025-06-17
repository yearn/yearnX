import {useCallback, useMemo, useState} from 'react';
import {useReadContract} from 'wagmi';
import {readContracts} from '@wagmi/core';

import {useWeb3} from '../contexts/useWeb3';
import {decodeAsBigInt, isAddress, isEthAddress} from '../utils';
import {erc4626Abi} from '../utils/abi/4626.abi';
import {toBigInt} from '../utils/format';
import {retrieveConfig, toWagmiProvider, withdrawFrom4626Vault, withdrawFromVault} from '../utils/wagmi';

import type {TAddress} from '../types';

type TUseWithdrawArgsBase = {
	tokenToWithdraw: TAddress;
	vault: TAddress;
	owner: TAddress;
	receiver?: TAddress;
	amountToWithdraw: bigint;
	chainID: number;
	disabled?: boolean;
	redeemTolerance: bigint;
};

type TUseWithdrawArgsLegacy = TUseWithdrawArgsBase & {
	version: 'LEGACY';
	minOutSlippage?: undefined;
};

type TUseWithdrawArgsERC4626 = TUseWithdrawArgsBase & {
	version: 'ERC-4626';
	minOutSlippage: bigint;
};

type TUseWithdrawArgs = TUseWithdrawArgsLegacy | TUseWithdrawArgsERC4626;

type TUseWithdrawResp = {
	maxWithdrawForUser: bigint; // Maximum amount that can be withdrawn by the user
	shareOf: bigint; // Amount of shares the user has
	balanceOf: bigint; // Amount of tokens the user has (converted from shares)
	canWithdraw: boolean; // If the token can be withdrawn
	isWithdrawing: boolean; // If the approval is in progress
	onWithdraw: (onSuccess?: () => void, onFailure?: () => void) => Promise<boolean>; // Function to withdraw the token
};

/**********************************************************************************************
 ** The useVaultWithdraw hook is used to withdraw tokens from a vault. It takes the following
 ** arguments:
 ** @params tokenToWithdraw: TAddress - The address of the token to withdraw.
 ** @params vault: TAddress - The address of the vault.
 ** @params owner: TAddress - The address of the owner of the token.
 ** @params receiver: TAddress - The address of the receiver of the token.
 ** @params amountToWithdraw: bigint - The amount of the token to withdraw.
 ** @params chainID: number - The chain ID.
 ** @params version: 'LEGACY' | 'ERC-4626' - The version of the vault.
 ** @params minOutSlippage: bigint - The minimum slippage for the withdraw (ERC-4626).
 ** @params redeemTolerance: bigint - The tolerance for the redeem (ERC-4626).
 **
 ** It returns the following:
 ** @returns maxWithdrawForUser: bigint - The maximum amount that can be withdrawn by the user.
 **          This is exprimed in underlying token, so this means this is a shortcut for
 **          `vault.convertToAsset(vault.balanceOf(owner))`.
 ** @returns shareOf: bigint - The amount of shares the user has.
 ** @returns balanceOf: bigint - The amount of tokens the user has (converted from shares).
 ** @returns canWithdraw: boolean - If the token can be withdrawn.
 ** @returns isWithdrawing: boolean - If the approval is in progress.
 ** @returns onWithdraw: () => void - Function to withdraw the token.
 *********************************************************************************************/
export function useVaultWithdraw(args: TUseWithdrawArgs): TUseWithdrawResp {
	const {provider} = useWeb3();
	const [isWithdrawing, set_isWithdrawing] = useState(false);

	/**********************************************************************************************
	 ** The ERC-4626 version of the vaults has a method called maxWithdraw: this function returns
	 ** the maximum amount of underlying assets that can be withdrawn in a single withdraw call by
	 ** the receiver.
	 ** We need this to be able to indicate to the user the maximum amount of tokens that can be
	 ** withdrawn.
	 *********************************************************************************************/
	const {data: maxWithdrawForUser, refetch: refetchMaxWithdrawForUser} = useReadContract({
		address: args.vault,
		abi: erc4626Abi,
		functionName: 'maxWithdraw',
		args: [args.owner],
		chainId: args.chainID,
		query: {
			enabled: isAddress(args.owner) && args.version === 'ERC-4626' && !args.disabled
		}
	});

	/**********************************************************************************************
	 ** The balanceOf for the vault is returning the number of shares the user has and not the
	 ** amount of tokens the user has. To get the amount of tokens the user has, we need to call
	 ** the convertToAssets function once we have the balanceOf.
	 *********************************************************************************************/
	const {data: shareOf, refetch: refetchBalanceOf} = useReadContract({
		address: args.vault,
		abi: erc4626Abi,
		functionName: 'balanceOf',
		args: [args.owner],
		chainId: args.chainID,
		query: {
			enabled: isAddress(args.owner) && !args.disabled
		}
	});
	const {data: convertToAssets} = useReadContract({
		address: args.vault,
		abi: erc4626Abi,
		functionName: 'convertToAssets',
		args: [toBigInt(shareOf)],
		chainId: args.chainID,
		query: {
			enabled: isAddress(args.owner) && args.version === 'ERC-4626' && shareOf !== undefined && !args.disabled
		}
	});
	const {data: decimals} = useReadContract({
		address: args.vault,
		abi: erc4626Abi,
		functionName: 'decimals',
		chainId: args.chainID,
		query: {
			enabled: isAddress(args.owner) && args.version === 'LEGACY' && shareOf !== undefined && !args.disabled
		}
	});
	const {data: pps} = useReadContract({
		address: args.vault,
		abi: erc4626Abi,
		functionName: 'pricePerShare',
		chainId: args.chainID,
		query: {
			enabled:
				isAddress(args.owner) &&
				args.version === 'LEGACY' &&
				shareOf !== undefined &&
				decimals !== undefined &&
				!args.disabled,
			select(pricePerShare) {
				return {
					balanceOf: (toBigInt(shareOf) * pricePerShare) / 10n ** toBigInt(decimals),
					pricePerShare: pricePerShare
				};
			}
		}
	});

	/**********************************************************************************************
	 ** canWithdraw is a boolean that is true if the token can be withdrawn. It can be withdrawn if
	 ** the following conditions are met:
	 ** 1. If the version is LEGACY, then we can directly deposit the token into the vault.
	 ** 2. If the token to withdraw is an Ethereum address, then the token cannot be withdrawn
	 ** 3. If the token to withdraw and the vault are valid addresses
	 ** 4. If the amount to withdraw is greater than 0 and less than the max withdraw for the user
	 *********************************************************************************************/
	const canWithdraw = useMemo(() => {
		if (isEthAddress(args.tokenToWithdraw)) {
			return false;
		}
		if (args.version === 'LEGACY') {
			return Boolean(isAddress(args.tokenToWithdraw) && isAddress(args.vault) && args.amountToWithdraw > 0n);
		}

		// If the tokenToWithdraw is not a valid address
		// If the vault is not a valid address
		// Then FALSE
		if (!isAddress(args.tokenToWithdraw) || !isAddress(args.vault)) {
			return false;
		}

		// If the amountToWithdraw is less than or equal to 0
		// Then FALSE
		if (args.amountToWithdraw <= 0n) {
			return false;
		}

		// If the amountToWithdraw is more than the maxWithdrawForUser
		// Then FALSE
		if (args.amountToWithdraw > toBigInt(maxWithdrawForUser)) {
			return false;
		}
		return true;
	}, [args.version, args.tokenToWithdraw, args.vault, args.amountToWithdraw, maxWithdrawForUser]);

	/**********************************************************************************************
	 ** onWithdraw is a function that is called to deposit the token. It takes two optional
	 ** arguments:
	 ** 1. onSuccess: A function that is called when the approval is successful
	 ** 2. onFailure: A function that is called when the approval fails
	 **
	 ** The function behaves differently based on the options passed in the args, aka if the user
	 ** wants to use a router or not.
	 *********************************************************************************************/
	const onWithdraw = useCallback(
		async (onSuccess?: () => void, onFailure?: () => void): Promise<boolean> => {
			if (!canWithdraw) {
				return false;
			}
			set_isWithdrawing(true);

			const wagmiProvider = await toWagmiProvider(provider);
			if (!wagmiProvider || !isAddress(wagmiProvider.address)) {
				set_isWithdrawing(false);
				return false;
			}

			if (args.redeemTolerance < 0n || args.redeemTolerance > 10000n) {
				throw new Error('Invalid redeemTolerance');
			}

			/**********************************************************************************************
			 ** If the version is LEGACY, then we can directly deposit the token into the vault. We cannot
			 ** use fancy stuff like permit or router.
			 *********************************************************************************************/
			if (args.version === 'LEGACY') {
				/******************************************************************************************
				 ** args.amountToWithdraw is the amount of TOKEN the user wants to get back. However, the
				 ** function expects the amount of shares the user wants to get back. We need to convert
				 ** the amount of TOKEN to the amount of shares based on the price per share.
				 *****************************************************************************************/
				const convertToShare =
					(args.amountToWithdraw * 10n ** toBigInt(decimals)) / toBigInt(pps?.pricePerShare);
				const tolerance = (toBigInt(shareOf) * args.redeemTolerance) / 10000n; // X% of the balance
				const isAskingToWithdrawAll = toBigInt(shareOf) - convertToShare < tolerance;

				const result = await withdrawFromVault({
					connector: provider,
					chainID: args.chainID,
					contractAddress: args.vault,
					receiver: isAddress(args.receiver) ? args.receiver : args.owner,
					amount: isAskingToWithdrawAll ? toBigInt(shareOf) : convertToShare
				});
				if (result.isSuccessful) {
					onSuccess?.();
				} else {
					onFailure?.();
				}
				set_isWithdrawing(false);
				return result.isSuccessful;
			}

			/**********************************************************************************************
			 ** If we are going with the ERC-4626 version of the vaults, then we can use either the redeem
			 ** or the withdraw function.
			 *********************************************************************************************/
			if (args.minOutSlippage < 0n || args.minOutSlippage > 10000n) {
				throw new Error('Invalid minOutSlippage');
			}

			/**********************************************************************************************
			 ** The user is inputing an amount of TOKEN he wants to get back. The SC has two different
			 ** method to withdraw funds:
			 ** Withdraw -> Tell me the amount of TOKEN you wanna take out
			 ** Redeem -> Tell me the amount of shares you wanna take out
			 ** Usually, we want to call redeem with the number of shares as this is the "safest" one.
			 ** However, as we are asking the user to input the amount of TOKEN he wants to get back, we
			 ** will need to do a little gymnastic to get the number of shares to redeem:
			 ** - First we need to check the amount the user inputed is valid.
			 ** - Then, we will query the SC to get the current share corresponding to the amount of TOKEN
			 **   the user wants to get back.
			 ** - We will do the same to know how many shares the user has.
			 ** - We would like to call `redeem` if the TOKEN -> share value correspond to the balance
			 **   of the user. (1 dai -> 1.1 share, user has 1.1 share, he wants to get 1 dai back, so
			 **   we can call redeem with the number of shares)
			 ** - However, between the moment the user clicks on the button and the moment the transaction
			 **   is executed, the price per share might have evolved, and some dust might be lost in
			 **   translation.
			 ** - To avoid this, we will add a slippage tolerance to the amount of TOKEN the user wants to
			 **   get back. If the price per share has evolved, we will still be able to call redeem.
			 ** - Otherwise, we will call withdraw with the amount of tokens the user wants to get back.
			 *********************************************************************************************/
			const [_convertToShare, _availableShares] = await readContracts(retrieveConfig(), {
				contracts: [
					{
						address: args.vault,
						chainId: args.chainID,
						abi: erc4626Abi,
						functionName: 'convertToShares',
						args: [args.amountToWithdraw]
					},
					{
						address: args.vault,
						chainId: args.chainID,
						abi: erc4626Abi,
						functionName: 'balanceOf',
						args: [wagmiProvider.address]
					}
				]
			});

			/**********************************************************************************************
			 ** At this point:
			 ** - decodeAsBigInt(convertToShare) -> Amount of shares the user asked to get back
			 ** - decodeAsBigInt(availableShares) -> Amount of shares the user has
			 ** - tolerance -> 1% of the balance
			 *********************************************************************************************/
			const convertToShare = decodeAsBigInt(_convertToShare);
			const availableShares = decodeAsBigInt(_availableShares);
			const tolerance = (availableShares * args.redeemTolerance) / 10000n; // X% of the balance
			const isAskingToWithdrawAll = availableShares - convertToShare < tolerance;

			const result = await withdrawFrom4626Vault({
				connector: provider,
				chainID: args.chainID,
				contractAddress: args.vault,
				amount: isAskingToWithdrawAll ? availableShares : args.amountToWithdraw,
				maxLoss: args.minOutSlippage,
				receiver: isAddress(args.receiver) ? args.receiver : args.owner,
				owner: args.owner,
				shouldUseRedeem: isAskingToWithdrawAll
			});
			if (result.isSuccessful) {
				onSuccess?.();
			} else {
				onFailure?.();
			}
			await refetchMaxWithdrawForUser();
			await refetchBalanceOf();
			set_isWithdrawing(false);
			return result.isSuccessful;
		},
		[
			canWithdraw,
			provider,
			args.redeemTolerance,
			args.version,
			args.minOutSlippage,
			args.vault,
			args.chainID,
			args.amountToWithdraw,
			args.receiver,
			args.owner,
			refetchMaxWithdrawForUser,
			refetchBalanceOf,
			pps?.pricePerShare,
			decimals,
			shareOf
		]
	);

	return {
		maxWithdrawForUser: toBigInt(maxWithdrawForUser),
		shareOf: toBigInt(shareOf),
		balanceOf: args.version === 'ERC-4626' ? toBigInt(convertToAssets) : toBigInt(pps?.balanceOf),
		canWithdraw,
		isWithdrawing,
		onWithdraw
	};
}
