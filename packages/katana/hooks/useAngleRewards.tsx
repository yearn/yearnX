import {useCallback, useEffect, useState} from 'react';
import {useWeb3} from '@lib/contexts/useWeb3';

const CACHE_KEY = 'angleRewards_cache';
const MERKL_REWARDS_API_ROUTE = '/api/merkl/rewards';

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

const fetchMerklRewards = async (address: string, chainId: number): Promise<TAngleRewardsResponse> => {
	const params = new URLSearchParams({
		address,
		chainId: String(chainId)
	});
	const response = await fetch(`${MERKL_REWARDS_API_ROUTE}?${params.toString()}`);

	if (!response.ok) {
		const responseBody = (await response.json().catch(() => null)) as {error?: string} | null;
		throw new Error(responseBody?.error ?? 'Failed to fetch Merkl rewards');
	}

	return (await response.json()) as TAngleRewardsResponse;
};

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
	hasRewards: boolean;
	markClaimed: (chainId: number) => void;
	canClaim: (chainId: number) => boolean;
	getClaimableAmount: (rewards: TAngleReward[]) => number;
	getRewardClaimable: (reward: TAngleReward) => number;
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
					fetchMerklRewards(address, CHAIN_IDS.POLYGON),
					fetchMerklRewards(address, CHAIN_IDS.KATANA)
				]);

				const preDepositRewards =
					polygonResponse.find(({chain}) => chain.id === CHAIN_IDS.POLYGON)?.rewards ?? [];
				const currentRewards = katanaResponse.find(({chain}) => chain.id === CHAIN_IDS.KATANA)?.rewards ?? [];

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

	const getRewardClaimable = useCallback((reward: TAngleReward): number => {
		const amount = parseFloat(reward.amount);
		const claimed = parseFloat(reward.claimed);
		const claimable = amount - claimed;
		return claimable > 0 ? claimable / 1e18 : 0;
	}, []);

	const getClaimableAmount = useCallback(
		(rewards: TAngleReward[]) => {
			return rewards.reduce((acc, reward) => acc + getRewardClaimable(reward), 0);
		},
		[getRewardClaimable]
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
		hasRewards: getClaimableAmount(preDepositRewards) > 0 || getClaimableAmount(currentRewards) > 0,
		markClaimed,
		canClaim,
		getClaimableAmount,
		getRewardClaimable
	};
};
