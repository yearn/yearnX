import {useCallback, useEffect, useState} from 'react';
import {useWeb3} from '@lib/contexts/useWeb3';

export type TRewardBreakdown = {
	reason: string;
	amount: string;
	claimed: string;
	pending: string;
	campaignId: string;
};

export type TAngleReward = {
	root: string;
	recipient: string;
	amount: string;
	claimed: string;
	pending: string;
	proofs: string[];
	token: {
		address: string;
		chainId: number;
		symbol: string;
		decimals: number;
		price: number;
	};
	breakdowns: TRewardBreakdown[];
};

export type TChainReward = {
	chain: {
		id: number;
		name: string;
		icon: string;
		Explorer: {
			id: string;
			type: string;
			url: string;
			chainId: number;
		}[];
	};
	rewards: TAngleReward[];
};

export type TAngleRewardsResponse = TChainReward[];

export const useAngleRewards = (): {
	preDepositRewards: TAngleReward[];
	currentRewards: TAngleReward[];
	isLoading: boolean;
	error: string | null;
	total: number;
	refetch: () => void;
	getTotalValueInUSD: () => number;
	hasRewards: boolean;
} => {
	const {address} = useWeb3();
	const [preDepositRewards, set_preDepositRewards] = useState<TAngleReward[]>([]);
	const [currentRewards, set_currentRewards] = useState<TAngleReward[]>([]);
	const [isLoading, set_isLoading] = useState(false);
	const [error, set_error] = useState<string | null>(null);
	const [total, set_total] = useState(0);

	const fetchRewards = useCallback(async () => {
		if (!address) {
			set_preDepositRewards([]);
			set_currentRewards([]);
			set_total(0);
			return;
		}

		set_isLoading(true);
		set_error(null);

		try {
			// Fetch rewards for both chains
			const [polygonResponse, katanaResponse] = await Promise.all([
				fetch(`https://api.merkl.xyz/v4/users/${address}/rewards?chainId=137`),
				fetch(`https://api.merkl.xyz/v4/users/${address}/rewards?chainId=747474`)
			]);

			const polygonData: TAngleRewardsResponse = polygonResponse.ok ? await polygonResponse.json() : [];
			const katanaData: TAngleRewardsResponse = katanaResponse.ok ? await katanaResponse.json() : [];

			// Filter KAT rewards for Polygon (chainId 137)
			const polygonChainData = polygonData.find(chain => chain.chain.id === 137);
			const preDepositKatRewards = polygonChainData?.rewards ?? [];
			// .filter(
			// 	reward => reward.token.symbol.includes('KAT') && parseFloat(reward.amount) > 0
			// ) || [];

			// Filter KAT rewards for Katana (chainId 747474)
			const katanaChainData = katanaData.find(chain => chain.chain.id === 747474);
			const currentKatRewards = katanaChainData?.rewards ?? [];
			// ?.rewards.filter(
			// 	reward => reward.token.symbol.includes('KAT') && parseFloat(reward.amount) > 0
			// ) || [];

			set_preDepositRewards(preDepositKatRewards);
			set_currentRewards(currentKatRewards);
			set_total(preDepositKatRewards.length + currentKatRewards.length);
		} catch (err) {
			set_error(err instanceof Error ? err.message : 'Failed to fetch rewards');
			set_preDepositRewards([]);
			set_currentRewards([]);
			set_total(0);
		} finally {
			set_isLoading(false);
		}
	}, [address]);

	useEffect(() => {
		fetchRewards();
	}, [fetchRewards]);

	const getTotalValueInUSD = useCallback(() => {
		const preDepositValue = preDepositRewards.reduce((acc, reward) => {
			const pendingAmount = parseFloat(reward.amount);
			const tokenPrice = reward.token.price;
			const tokenDecimals = reward.token.decimals;

			// Convert from token units to actual amount and multiply by price
			const actualAmount = pendingAmount / Math.pow(10, tokenDecimals);
			return acc + actualAmount * tokenPrice;
		}, 0);

		const currentValue = currentRewards.reduce((acc, reward) => {
			const pendingAmount = parseFloat(reward.amount);
			const tokenPrice = reward.token.price;
			const tokenDecimals = reward.token.decimals;

			// Convert from token units to actual amount and multiply by price
			const actualAmount = pendingAmount / Math.pow(10, tokenDecimals);
			return acc + actualAmount * tokenPrice;
		}, 0);

		return preDepositValue + currentValue;
	}, [preDepositRewards, currentRewards]);

	return {
		preDepositRewards,
		currentRewards,
		isLoading,
		error,
		total,
		refetch: fetchRewards,
		getTotalValueInUSD,
		hasRewards: preDepositRewards.length > 0 || currentRewards.length > 0
	};
};
