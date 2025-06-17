import {useCallback, useMemo, useState} from 'react';
import {erc20Abi, maxUint128} from 'viem';
import {useReadContract} from 'wagmi';

import {isAddress, isEthAddress} from '../utils';
import {approveERC20} from '../utils/wagmi';
import {isPermitSupported, signPermit} from './usePermit';

import type {Connector} from 'wagmi';
import type {TAddress} from '../types';
import type {TPermitSignature} from './usePermit.types';

type TUseApproveArgs = {
	provider: Connector | undefined;
	tokenToApprove: TAddress; // Token we want to approve
	spender: TAddress; // Address that will spend the token. In case of Yearn Permit, it should be the yRouter address
	owner: TAddress; // Address that owns the token
	amountToApprove: bigint; // Amount to approve
	chainID: number; // Chain ID
	disabled?: boolean;
} & (
	| {
			shouldUsePermit: boolean; // Should use permit or not
			deadline: number; // Deadline for the permit
	  }
	| {
			shouldUsePermit: false; // Should use permit or not
			deadline?: undefined; // Deadline for the permit
	  }
);

type TUseApproveResp = {
	amountApproved: bigint; // Amount approved
	isApproving: boolean; // If the approval is in progress
	isApproved: boolean; // If the token is approved or not
	isInfiniteApproved: boolean; // If the token is approved with infinite allowance
	permitSignature?: TPermitSignature; // Signature for the permit,
	isLoading: boolean; // Is fetching allowance
	onApprove: (onSuccess?: () => void, onFailure?: () => void) => Promise<boolean>; // Function to approve the token
	onClearPermit: () => void; // Function to clear the permit
};

export function useApprove(args: TUseApproveArgs): TUseApproveResp {
	const [isApproving, set_isApproving] = useState(false);
	const [permitSignature, set_permitSignature] = useState<TPermitSignature | undefined>(undefined);
	const [permitAllowance, set_permitAllowance] = useState<bigint | undefined>(undefined);

	const {
		data: allowance,
		isLoading,
		refetch
	} = useReadContract({
		address: args.tokenToApprove,
		abi: erc20Abi,
		functionName: 'allowance',
		args: [args.owner, args.spender],
		chainId: args.chainID,
		query: {enabled: !args.disabled}
	});

	/**********************************************************************************************
	 ** canApprove is a boolean that is true if the token can be approved. It can be approved if
	 ** the following conditions are met:
	 ** 1. args.tokenToApprove is a valid address
	 ** 2. args.spender is a valid address
	 ** 3. args.amountToApprove is greater than 0
	 ** Nb: If args.tokenToApprove is an Ethereum address, then the token cannot be approved as
	 **     it's not an erc20 contract
	 *********************************************************************************************/
	const canApprove = useMemo(() => {
		if (isEthAddress(args.tokenToApprove)) {
			return false;
		}
		return isAddress(args.tokenToApprove) && isAddress(args.spender) && args.amountToApprove > 0n;
	}, [args.tokenToApprove, args.spender, args.amountToApprove]);

	/**********************************************************************************************
	 ** isApproved is a boolean that is true if the token is approved. It is calculated based on
	 ** the following conditions:
	 ** 1. If permitSignature and permitAllowance are defined, then isApproved is true if
	 **    permitAllowance is greater than or equal to args.amountToApprove
	 ** 2. If permitSignature is not defined, then isApproved is true if allowance is greater
	 **    than or equal to args.amountToApprove
	 *********************************************************************************************/
	const isApproved = useMemo((): boolean => {
		if (isEthAddress(args.tokenToApprove)) {
			return true;
		}
		if (permitSignature && permitAllowance) {
			return permitAllowance >= args.amountToApprove;
		}
		return (allowance && allowance >= args.amountToApprove) || false;
	}, [allowance, args.amountToApprove, args.tokenToApprove, permitAllowance, permitSignature]);

	/**********************************************************************************************
	 ** isInfiniteApproved is a boolean that is true if the token is approved with infinite
	 ** allowance. It is calculated based on the following conditions:
	 ** 1. If permitSignature and permitAllowance are defined, then isInfiniteApproved is true if
	 **    permitAllowance is greater than or equal to maxUint128
	 ** 2. If permitSignature is not defined, then isInfiniteApproved is true if allowance is
	 **    greater than or equal to maxUint128
	 *********************************************************************************************/
	const isInfiniteApproved = useMemo((): boolean => {
		if (isEthAddress(args.tokenToApprove)) {
			return true;
		}
		if (permitSignature && permitAllowance) {
			return permitAllowance >= maxUint128;
		}
		return (allowance && allowance >= maxUint128) || false;
	}, [allowance, args.tokenToApprove, permitAllowance, permitSignature]);

	/**********************************************************************************************
	 ** onApprove is a function that is called to approve the token. It takes two optional
	 ** arguments:
	 ** 1. onSuccess: A function that is called when the approval is successful
	 ** 2. onFailure: A function that is called when the approval fails
	 **
	 ** The function performs the following steps:
	 ** 1. If canApprove is false, then return
	 ** 2. Set isApproving to true
	 ** 3. If args.shouldUsePermit is true, then check if the token supports permit
	 ** 4. If the token supports permit, then sign the permit
	 ** 5. If the permit is not signed, then set permitSignature and permitAllowance to undefined
	 **    and call onFailure
	 ** 6. If the permit is signed, then set permitSignature to the signature and permitAllowance
	 **    to args.amountToApprove and call onSuccess
	 ** 7. If args.shouldUsePermit is false, then approve the token
	 ** 8. If the approval is successful, then call onSuccess
	 ** 9. If the approval fails, then call onFailure
	 ** 10. Refetch the allowance
	 ** 11. Set isApproving to false
	 *********************************************************************************************/
	const onApprove = useCallback(
		async (onSuccess?: () => void, onFailure?: () => void): Promise<boolean> => {
			if (!canApprove) {
				return false;
			}

			set_isApproving(true);
			if (args.shouldUsePermit) {
				const canUsePermit = await isPermitSupported({
					contractAddress: args.tokenToApprove,
					chainID: args.chainID,
					options: {disableExceptions: true}
				});
				if (canUsePermit) {
					const signature = await signPermit({
						contractAddress: args.tokenToApprove,
						ownerAddress: args.owner,
						spenderAddress: args.spender,
						value: args.amountToApprove,
						deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * args.deadline), // args.deadline minutes,
						chainID: args.chainID
					});

					if (!signature) {
						set_permitSignature(undefined);
						set_permitAllowance(undefined);
						onFailure?.();
					} else {
						set_permitSignature(signature);
						set_permitAllowance(args.amountToApprove);
						onSuccess?.();
					}
					await refetch();
					set_isApproving(false);
					return !!signature;
				}
			}

			const result = await approveERC20({
				connector: args.provider,
				chainID: args.chainID,
				contractAddress: args.tokenToApprove,
				spenderAddress: args.spender,
				amount: args.amountToApprove
			});
			set_permitSignature(undefined);
			set_permitAllowance(undefined);
			if (result.isSuccessful) {
				onSuccess?.();
			} else {
				onFailure?.();
			}

			await refetch();
			set_isApproving(false);
			return result.isSuccessful;
		},
		[
			args.amountToApprove,
			args.chainID,
			args.deadline,
			args.owner,
			args.provider,
			args.shouldUsePermit,
			args.spender,
			args.tokenToApprove,
			canApprove,
			refetch
		]
	);

	/**********************************************************************************************
	 ** onClearPermit is a function that is called to clear the permit. It performs the following
	 ** steps:
	 ** 1. Set permitSignature and permitAllowance to undefined
	 *********************************************************************************************/
	const onClearPermit = useCallback(() => {
		set_permitSignature(undefined);
		set_permitAllowance(undefined);
	}, []);

	return {
		amountApproved: args.shouldUsePermit && permitSignature ? permitAllowance || allowance || 0n : allowance || 0n,
		isApproving,
		isApproved,
		isLoading,
		isInfiniteApproved,
		permitSignature,
		onApprove,
		onClearPermit
	};
}
