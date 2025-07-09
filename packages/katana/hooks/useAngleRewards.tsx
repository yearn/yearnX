import {useCallback, useEffect, useState} from 'react';
import {useWeb3} from '@lib/contexts/useWeb3';

const CACHE_KEY = 'angleRewards_cache';

const EIGHT_HOURS = 8 * 60 * 60 * 1000;

const CHAIN_IDS = {
	POLYGON: 137,
	KATANA: 747474
} as const;

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

type TCachedRewardsData = {
	preDepositRewards: TAngleReward[];
	currentRewards: TAngleReward[];
	timestamp: number;
	address: string;
	lastClaimed?: {[key: number]: number};
};

export const useAngleRewards = (): {
	preDepositRewards: TAngleReward[];
	currentRewards: TAngleReward[];
	isLoading: boolean;
	error: string | null;
	total: number;
	refetch: () => void;
	getTotalValueInUSD: () => number;
	hasRewards: boolean;
	markClaimed: (chainId: number) => void;
	canClaim: (chainId: number) => boolean;
} => {
	const {address} = useWeb3();
	const [preDepositRewards, set_preDepositRewards] = useState<TAngleReward[]>([]);
	const [currentRewards, set_currentRewards] = useState<TAngleReward[]>([]);
	const [isLoading, set_isLoading] = useState(false);
	const [error, set_error] = useState<string | null>(null);
	const [total, set_total] = useState(0);
	const [claimTimestamps, set_claimTimestamps] = useState<{[key: number]: number}>({});

	const getCache = useCallback((): TCachedRewardsData | null => {
		try {
			const cached = localStorage.getItem(CACHE_KEY);
			if (!cached) {
				return null;
			}

			const parsed: TCachedRewardsData = JSON.parse(cached);
			return parsed.address === address ? parsed : null;
		} catch {
			return null;
		}
	}, [address]);

	const updateCache = useCallback(
		(updates: Partial<TCachedRewardsData>) => {
			const existing = getCache() || {
				timestamp: 0,
				address: address!,
				preDepositRewards: [],
				currentRewards: [],
				lastClaimed: {}
			};
			const updated = {...existing, ...updates};
			localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
			set_claimTimestamps(updated.lastClaimed || {});
		},
		[address, getCache]
	);

	const fetchRewards = useCallback(
		async (forceRefetch = false) => {
			if (!address) {
				set_preDepositRewards([]);
				set_currentRewards([]);
				set_total(0);
				set_claimTimestamps({});
				return;
			}

			const now = Date.now();

			// Check cache first
			if (!forceRefetch) {
				const cached = getCache();
				if (cached && now - cached.timestamp < EIGHT_HOURS) {
					set_preDepositRewards(cached.preDepositRewards);
					set_currentRewards(cached.currentRewards);
					set_total(cached.preDepositRewards.length + cached.currentRewards.length);
					set_claimTimestamps(cached.lastClaimed || {});
					return;
				}
			}

			set_isLoading(true);
			set_error(null);

			try {
				const [polygonResponse, katanaResponse] = await Promise.all([
					fetch(`https://api.merkl.xyz/v4/users/${address}/rewards?chainId=${CHAIN_IDS.POLYGON}`),
					fetch(`https://api.merkl.xyz/v4/users/${address}/rewards?chainId=${CHAIN_IDS.KATANA}`)
				]);

				const polygonData: TAngleRewardsResponse = polygonResponse.ok ? await polygonResponse.json() : [];
				const katanaData: TAngleRewardsResponse = katanaResponse.ok ? await katanaResponse.json() : [];

				const preDepositRewards =
					polygonData.find(chain => chain.chain.id === CHAIN_IDS.POLYGON)?.rewards ?? [];
				const currentRewards = katanaData.find(chain => chain.chain.id === CHAIN_IDS.KATANA)?.rewards ?? [];

				updateCache({
					preDepositRewards,
					currentRewards,
					timestamp: now,
					address
				});

				set_preDepositRewards(preDepositRewards);
				set_currentRewards(currentRewards);
				set_total(preDepositRewards.length + currentRewards.length);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Failed to fetch rewards';
				set_error(errorMessage);
				set_preDepositRewards([]);
				set_currentRewards([]);
				set_total(0);
			} finally {
				set_isLoading(false);
			}
		},
		[address, getCache, updateCache]
	);

	const getTotalValueInUSD = useCallback(() => {
		const calculateValue = (rewards: TAngleReward[]): number =>
			rewards.reduce((acc, reward) => {
				const amount = parseFloat(reward.amount);
				const {price} = reward.token;
				const {decimals} = reward.token;
				const actualAmount = amount / Math.pow(10, decimals);
				return acc + actualAmount * price;
			}, 0);

		return calculateValue(preDepositRewards) + calculateValue(currentRewards);
	}, [preDepositRewards, currentRewards]);

	const markClaimed = useCallback(
		(chainId: number) => {
			if (!address) {
				return;
			}

			const existing = getCache();
			if (existing) {
				const updatedTimestamps = {...existing.lastClaimed, [chainId]: Date.now()};
				updateCache({lastClaimed: updatedTimestamps});
			}
		},
		[address, getCache, updateCache]
	);

	const canClaim = useCallback(
		(chainId: number) => {
			const timestamp = claimTimestamps[chainId];
			return !timestamp || Date.now() - timestamp >= EIGHT_HOURS;
		},
		[claimTimestamps]
	);

	useEffect(() => {
		fetchRewards();
	}, [fetchRewards]);

	return {
		preDepositRewards,
		currentRewards,
		isLoading,
		error,
		total,
		refetch: async () => fetchRewards(true),
		getTotalValueInUSD,
		hasRewards: preDepositRewards.length > 0 || currentRewards.length > 0,
		markClaimed,
		canClaim
	};
};
