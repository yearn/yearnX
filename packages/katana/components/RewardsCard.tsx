import {useCallback, useEffect, useState} from 'react';
import toast from 'react-hot-toast';
import {useWaitForTransactionReceipt, useWriteContract} from 'wagmi';
import {useWeb3} from '@lib/contexts/useWeb3';
import {cl, formatAmount} from '@lib/utils';

import type {TAngleReward} from 'packages/katana/hooks/useAngleRewards';
import type {FC} from 'react';

// Merkl Distributor contract addresses
const DISTRIBUTOR_ADDRESSES = {
	137: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae', // Polygon
	747474: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae' // Katana
} as const;

// Merkl Distributor ABI for claiming
const DISTRIBUTOR_ABI = [
	{
		inputs: [
			{
				internalType: 'address[]',
				name: 'users',
				type: 'address[]'
			},
			{
				internalType: 'address[]',
				name: 'tokens',
				type: 'address[]'
			},
			{
				internalType: 'uint256[]',
				name: 'amounts',
				type: 'uint256[]'
			},
			{
				internalType: 'bytes32[][]',
				name: 'proofs',
				type: 'bytes32[][]'
			}
		],
		name: 'claim',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	}
] as const;

type TProps = {
	title: string;
	rewards: TAngleReward[];
	chainId: number;
};

const getChainName = (chainId: number): string => {
	if (chainId === 137) {
		return 'Polygon';
	}
	return 'Katana';
};

export const RewardsCard: FC<TProps> = ({title, rewards, chainId}) => {
	const {address, chainID: currentChainId, onSwitchChain} = useWeb3();
	const [currentReward, set_currentReward] = useState<TAngleReward | null>(null);
	const [error, set_error] = useState<string | null>(null);

	const isInvalidChain = chainId !== currentChainId;

	// Wagmi hooks for contract interaction
	const {data: claimHash, writeContract: claimReward} = useWriteContract();
	const {isLoading: isClaimPending, isSuccess: isClaimSuccess} = useWaitForTransactionReceipt({
		hash: claimHash,
		chainId: chainId as 137 | 747474
	});

	const handleClaimAllRewards = useCallback(async () => {
		if (!address) {
			set_error('Please connect your wallet');
			return;
		}

		set_currentReward(rewards[0]); // Set first reward as placeholder for loading state
		set_error(null);

		try {
			const distributorAddress = DISTRIBUTOR_ADDRESSES[chainId as keyof typeof DISTRIBUTOR_ADDRESSES];

			if (!distributorAddress) {
				throw new Error(`Unsupported chain ID: ${chainId}`);
			}

			const users: `0x${string}`[] = [];
			const tokens: `0x${string}`[] = [];
			const amounts: bigint[] = [];
			const proofs: `0x${string}`[][] = [];

			for (const reward of rewards) {
				users.push(address as `0x${string}`);
				tokens.push(reward.token.address as `0x${string}`);
				amounts.push(BigInt(reward.amount));
				proofs.push(reward.proofs as `0x${string}`[]);
			}

			// Execute claim tx
			claimReward({
				address: distributorAddress as `0x${string}`,
				abi: DISTRIBUTOR_ABI,
				functionName: 'claim',
				args: [users, tokens, amounts, proofs],
				chainId: chainId as 137 | 747474
			});
		} catch (err) {
			console.error('Claim failed:', err);
			const errorMessage = err instanceof Error ? err.message : 'Failed to claim rewards';
			set_error(errorMessage);
			set_currentReward(null);

			// Show error toast
			toast.error(errorMessage, {
				duration: 5000,
				style: {
					background: '#ef4444',
					color: 'white'
				}
			});
		}
	}, [address, chainId, claimReward, rewards]);

	// Catch claim
	useEffect(() => {
		if (isClaimSuccess && currentReward) {
			const totalAmount = rewards.reduce((acc, reward) => acc + parseFloat(reward.amount) / 1e18, 0);
			const tokenSymbols = [...new Set(rewards.map(reward => reward.token.symbol))];
			const symbolsText = tokenSymbols.join(', ');

			toast.success(`Successfully claimed ${formatAmount(totalAmount, 4)} ${symbolsText}`);
			set_currentReward(null);
		}
	}, [isClaimSuccess, currentReward, claimHash, chainId, rewards]);

	if (rewards.length === 0) {
		return null;
	}

	// Calculate total claimable and pending amounts
	const totalClaimable = rewards.reduce((acc, reward) => {
		return acc + parseFloat(reward.amount) / 1e18;
	}, 0);

	const totalPending = rewards.reduce((acc, reward) => {
		return acc + parseFloat(reward.pending || '0') / 1e18;
	}, 0);

	return (
		<div className={'min-w-[300px] space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4'}>
			<p className={'text-md w-full border-b border-neutral-200 pb-2 text-left text-black'}>{title}</p>
			<div className={'space-y-2 py-2'}>
				{totalClaimable > 0 && (
					<div className={'flex items-center justify-between'}>
						<div className={'flex h-6 items-center justify-center'}>
							<span className={'font-medium text-black'}>{'Claimable'}</span>
						</div>
						<div className={'flex gap-2'}>
							{rewards.map(reward => (
								<p
									className={
										'rounded-full border border-neutral-200 bg-neutral-200 px-2 text-[14px] font-medium text-neutral-900 '
									}>
									{formatAmount(parseFloat(reward.amount) / 1e18, 4)} {reward.token.symbol}
								</p>
							))}
						</div>
					</div>
				)}
				{totalPending > 0 && (
					<div className={'flex items-center justify-between opacity-50'}>
						<div className={'flex h-6 items-center justify-center'}>
							<span className={'font-medium text-black'}>{'Pending'}</span>
						</div>
						<div className={'flex gap-2'}>
							{rewards.map(reward => (
								<p
									className={
										'rounded-full border border-neutral-200 bg-neutral-200 px-2 text-[14px] font-medium text-neutral-900 '
									}>
									{formatAmount(parseFloat(reward.pending) / 1e18, 4)} {reward.token.symbol}
								</p>
							))}
						</div>
					</div>
				)}
			</div>
			{error && (
				<div className={'mt-3 rounded-lg border border-red-200 bg-red-50 p-3'}>
					<p className={'text-sm text-red-700'}>{error}</p>
				</div>
			)}
			{totalClaimable > 0 && (
				<div className={'space-y-2'}>
					<button
						onClick={async () => {
							if (isInvalidChain) {
								onSwitchChain(chainId);
							} else {
								// Claim all rewards in a single transaction
								await handleClaimAllRewards();
							}
						}}
						disabled={isClaimPending}
						className={cl(
							'bg-button text-accentText !h-12 w-full rounded-xl p-3 transition-colors hover:bg-[#f8fe06] hover:text-black disabled:cursor-not-allowed disabled:opacity-50'
						)}>
						{isClaimPending
							? 'Claiming...'
							: isInvalidChain
								? `Switch to ${getChainName(chainId)}`
								: 'Claim All'}
					</button>
				</div>
			)}
		</div>
	);
};
