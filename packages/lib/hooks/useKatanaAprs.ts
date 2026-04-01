import {useEffect, useState} from 'react';
import axios from 'axios';

const CACHE_KEY = 'katana-aprs-cache';
const CACHE_TTL = 15 * 60 * 1000; // 15 min

export type TKatanaAprs = {
	[key: string]: {
		apr: {
			netAPR: number;
			extra: TAprData;
		};
	};
};

export type TAprData = {
	stakingRewardsAPR: number;
	gammaRewardAPR: number;
	katanaRewardsAPR: number; // legacy field for App rewards from Morpho, Sushi, Yearn, etc.
	katanaAppRewardsAPR: number; // rewards from Morpho, Sushi, Yearn, etc.
	fixedRateKatanaRewards: number; // fixed rate rewards from Katana
	katanaBonusAPY: number; // bonus APR from Katana for not leaving the vault
	katanaNativeYield: number; // yield from katana markets (the netAPR). This is subsidized if low.
	steerPointsPerDollar?: number; // points per dollar from APR oracle (metadata, not part of APR sum)
};

type TCacheData = {
	data: Partial<TKatanaAprs>;
	timestamp: number;
};

type TRawAprData = {
	stakingRewardsAPR?: number | null;
	gammaRewardAPR?: number | null;
	katanaRewardsAPR?: number | null;
	katanaAppRewardsAPR?: number | null;
	fixedRateKatanaRewards?: number | null;
	FixedRateKatanaRewards?: number | null;
	katanaBonusAPY?: number | null;
	katanaNativeYield?: number | null;
	steerPointsPerDollar?: number | null;
};

type TRawKatanaAprs = {
	[key: string]: {
		apr: {
			netAPR: number;
			extra: TRawAprData;
		};
	};
};

const getNumberOrZero = (value: number | null | undefined): number => {
	return typeof value === 'number' ? value : 0;
};

export const normalizeAprData = (aprData?: TRawAprData): TAprData => {
	return {
		stakingRewardsAPR: getNumberOrZero(aprData?.stakingRewardsAPR),
		gammaRewardAPR: getNumberOrZero(aprData?.gammaRewardAPR),
		katanaRewardsAPR: getNumberOrZero(aprData?.katanaRewardsAPR),
		katanaAppRewardsAPR: getNumberOrZero(aprData?.katanaAppRewardsAPR),
		fixedRateKatanaRewards: getNumberOrZero(
			aprData?.fixedRateKatanaRewards ?? aprData?.FixedRateKatanaRewards
		),
		katanaBonusAPY: getNumberOrZero(aprData?.katanaBonusAPY),
		katanaNativeYield: getNumberOrZero(aprData?.katanaNativeYield),
		steerPointsPerDollar: getNumberOrZero(aprData?.steerPointsPerDollar)
	};
};

export const normalizeKatanaAprs = (aprData: Partial<TRawKatanaAprs>): Partial<TKatanaAprs> => {
	return Object.entries(aprData).reduce<Partial<TKatanaAprs>>((accumulator, [vaultAddress, vaultData]) => {
		if (!vaultData) {
			return accumulator;
		}

		accumulator[vaultAddress.toLowerCase()] = {
			...vaultData,
			apr: {
				...vaultData.apr,
				extra: normalizeAprData(vaultData.apr.extra)
			}
		};

		return accumulator;
	}, {});
};

export const useKatanaAprs = (): {data: Partial<TKatanaAprs>; isLoading: boolean; error: Error | null} => {
	const [data, set_data] = useState<Partial<TKatanaAprs>>({});
	const [isLoading, set_isLoading] = useState(true);
	const [error, set_error] = useState<Error | null>(null);

	useEffect(() => {
		const fetchData = async (): Promise<void> => {
			try {
				// Check cache first
				const cachedString = localStorage.getItem(CACHE_KEY);
				if (cachedString) {
					const cached: TCacheData = JSON.parse(cachedString);
					const now = Date.now();
					const normalizedCachedData = normalizeKatanaAprs(cached.data);

					// Return cached data if within TTL
					if (now - cached.timestamp < CACHE_TTL) {
						set_data(normalizedCachedData);
						set_isLoading(false);
						return;
					}
				}

				const apiUrl = process.env.KATANA_APR_SERVICE_API;
				if (!apiUrl) {
					throw new Error('KATANA_APR_SERVICE_API environment variable is not set');
				}
				const freshData = await axios.get(apiUrl).then(res => normalizeKatanaAprs(res.data));

				const cacheData: TCacheData = {
					data: freshData,
					timestamp: Date.now()
				};
				localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

				set_data(freshData);
				set_error(null);
			} catch (err) {
				set_error(err as Error);
				const cachedString = localStorage.getItem(CACHE_KEY);
				if (cachedString) {
					const cached: TCacheData = JSON.parse(cachedString);
					set_data(normalizeKatanaAprs(cached.data));
				}
			} finally {
				set_isLoading(false);
			}
		};

		fetchData();
	}, []);

	return {data, isLoading, error};
};
