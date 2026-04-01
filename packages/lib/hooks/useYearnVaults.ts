import {zeroAddress} from 'viem';
import {z} from 'zod';
import {useFetch} from '@lib/hooks/useFetch';
import {toAddress} from '@lib/utils';
import {supportedNetworks} from '@lib/utils/tools.chains';
import {useDeepCompareMemo} from '@react-hookz/web';

import type {TDict} from '@lib/types';
import type {TPossibleVaultFilter, TUseFetchYearnVaults, TYDaemonVault} from './useYearnVaults.types';

/**********************************************************************************************
 ** Kong API vault list schema
 *********************************************************************************************/
const kongVaultSchema = z
	.object({
		chainId: z.number(),
		address: z.string(),
		name: z.string().default(''),
		symbol: z.string().nullable().default(''),
		apiVersion: z.string().nullable().default(''),
		decimals: z.number().nullable().default(18),
		asset: z
			.object({
				address: z.string().default(zeroAddress),
				name: z.string().default(''),
				symbol: z.string().default(''),
				decimals: z.number().nullable().default(18)
			})
			.nullable()
			.default(null),
		tvl: z.number().nullable().default(0),
		pricePerShare: z.union([z.string(), z.number()]).default('0'),
		performance: z
			.object({
				oracle: z
					.object({
						apr: z.number().nullable().default(null),
						apy: z.number().nullable().default(null)
					})
					.nullable()
					.default(null),
				estimated: z
					.object({
						apr: z.number().nullable().default(null),
						apy: z.number().nullable().default(null),
						type: z.string().nullable().default(null),
						components: z
							.object({
								boost: z.number().nullable().optional(),
								poolAPY: z.number().nullable().optional(),
								boostedAPR: z.number().nullable().optional(),
								baseAPR: z.number().nullable().optional(),
								rewardsAPR: z.number().nullable().optional(),
								katanaBonusAPY: z.number().nullable().optional(),
								katanaNativeYield: z.number().nullable().optional(),
								katanaAppRewardsAPR: z.number().nullable().optional(),
								steerPointsPerDollar: z.number().nullable().optional(),
								fixedRateKatanaRewards: z.number().nullable().optional(),
								FixedRateKatanaRewards: z.number().nullable().optional()
							})
							.nullable()
							.default(null)
					})
					.nullable()
					.default(null),
				historical: z
					.object({
						net: z.number().nullable().default(null),
						weeklyNet: z.number().nullable().default(null),
						monthlyNet: z.number().nullable().default(null),
						inceptionNet: z.number().nullable().default(null)
					})
					.nullable()
					.default(null)
			})
			.nullable()
			.default(null),
		fees: z
			.object({
				managementFee: z.number().default(0),
				performanceFee: z.number().default(0)
			})
			.nullable()
			.default(null),
		category: z.string().nullable().default('Volatile'),
		type: z.string().nullable().default('Standard'),
		kind: z.string().nullable().default('Legacy'),
		v3: z.boolean().default(false),
		isRetired: z.boolean().default(false),
		isHidden: z.boolean().default(false),
		isBoosted: z.boolean().default(false),
		isHighlighted: z.boolean().default(false),
		inclusion: z
			.object({
				isYearn: z.boolean().optional(),
				isKatana: z.boolean().optional(),
				isMorpho: z.boolean().optional(),
				isGimme: z.boolean().optional(),
				isYearnJuiced: z.boolean().optional(),
				isPoolTogether: z.boolean().optional(),
				isCove: z.boolean().optional(),
				isPublicERC4626: z.boolean().optional()
			})
			.nullable()
			.default(null),
		strategiesCount: z.number().default(0),
		riskLevel: z.number().nullable().default(-1),
		migration: z.union([z.boolean(), z.object({}).passthrough()]).default(false),
		origin: z.string().nullable().default(null),
		staking: z
			.object({
				address: z.string().nullable().default(null),
				available: z.boolean().default(false),
				source: z.string().optional().default('')
			})
			.nullable()
			.default(null)
	})
	.passthrough();

const kongVaultListSchema = z.array(kongVaultSchema);
type TKongVault = z.infer<typeof kongVaultSchema>;

const KATANA_CHAIN_ID = 747474;

function pickNumber(...values: (number | null | undefined)[]): number {
	for (const v of values) {
		if (typeof v === 'number' && Number.isFinite(v)) {
			return v;
		}
	}
	return 0;
}

function normalizeFee(value: number | null | undefined): number {
	if (value === null || value === undefined || Number.isNaN(value)) {
		return 0;
	}
	return value > 1 ? value / 10000 : value;
}

/**********************************************************************************************
 ** Transform a single Kong vault into the TYDaemonVault shape used throughout the app
 *********************************************************************************************/
function mapKongToVault(vault: TKongVault): TYDaemonVault {
	const perf = vault.performance;
	const est = perf?.estimated;
	const hist = perf?.historical;
	const oracle = perf?.oracle;
	const components = est?.components;
	const isKatana = vault.chainId === KATANA_CHAIN_ID;

	// Forward APR: for Katana prefer oracle, otherwise prefer estimated (matches yearn.fi)
	const forwardNetAPR = isKatana
		? pickNumber(oracle?.apy, oracle?.apr, est?.apy, est?.apr, hist?.net)
		: pickNumber(est?.apy, est?.apr, oracle?.apy, oracle?.apr, hist?.net);

	return {
		address: toAddress(vault.address),
		version: vault.apiVersion || '',
		type: (vault.type as TYDaemonVault['type']) || 'Standard',
		kind: (vault.kind as TYDaemonVault['kind']) || 'Legacy',
		symbol: vault.symbol || '',
		name: vault.name || '',
		description: '',
		category: (vault.category as TYDaemonVault['category']) || 'Volatile',
		decimals: vault.decimals || 18,
		chainID: vault.chainId,
		token: {
			address: toAddress(vault.asset?.address || zeroAddress),
			name: vault.asset?.name || '',
			symbol: vault.asset?.symbol || '',
			description: '',
			decimals: vault.asset?.decimals || 18
		},
		tvl: {
			totalAssets: BigInt(0),
			tvl: vault.tvl || 0,
			price: 0
		},
		apr: {
			type: est?.type || (oracle?.apy != null ? 'oracle' : 'unknown'),
			netAPR: pickNumber(hist?.net),
			fees: {
				performance: normalizeFee(vault.fees?.performanceFee),
				withdrawal: 0,
				management: normalizeFee(vault.fees?.managementFee)
			},
			extra: {
				stakingRewardsAPR: 0,
				gammaRewardAPR: 0,
				katanaAppRewardsAPR: pickNumber(components?.katanaAppRewardsAPR),
				fixedRateKatanaRewards: pickNumber(
					components?.fixedRateKatanaRewards,
					components?.FixedRateKatanaRewards
				),
				katanaNativeYield: pickNumber(components?.katanaNativeYield),
				katanaBonusAPY: pickNumber(components?.katanaBonusAPY),
				steerPointsPerDollar: pickNumber(components?.steerPointsPerDollar)
			},
			points: {
				weekAgo: pickNumber(hist?.weeklyNet),
				monthAgo: pickNumber(hist?.monthlyNet),
				inception: pickNumber(hist?.inceptionNet)
			},
			forwardAPR: {
				type: est?.type || (oracle?.apr != null ? 'oracle' : ''),
				netAPR: forwardNetAPR,
				composite: {
					boost: pickNumber(components?.boost),
					poolAPY: pickNumber(components?.poolAPY),
					boostedAPR: pickNumber(components?.boostedAPR),
					baseAPR: pickNumber(components?.baseAPR),
					cvxAPR: 0,
					rewardsAPR: pickNumber(components?.rewardsAPR),
					v3OracleCurrentAPR: 0,
					v3OracleStratRatioAPR: 0,
					keepCRV: 0,
					keepVELO: 0,
					cvxKeepCRV: 0
				}
			}
		},
		featuringScore: 0,
		strategies: [],
		staking: {
			address: toAddress(vault.staking?.address || zeroAddress),
			available: vault.staking?.available || false,
			source: vault.staking?.source || ''
		},
		migration: {
			available: vault.migration === true,
			address: toAddress(zeroAddress),
			contract: toAddress(zeroAddress)
		},
		info: {
			sourceURL: '',
			riskLevel: vault.riskLevel ?? -1,
			uiNotice: '',
			isRetired: vault.isRetired,
			isBoosted: vault.isBoosted,
			isHighlighted: vault.isHighlighted
		},
		pricePerShare: String(vault.pricePerShare || '0')
	};
}

/**********************************************************************************************
 ** Map vault filter names to Kong inclusion flags
 *********************************************************************************************/
function matchesFilter(vault: TKongVault, filter: TPossibleVaultFilter): boolean {
	const inc = vault.inclusion;
	switch (filter) {
		case 'katana':
			return inc?.isKatana === true;
		case 'morpho':
			return inc?.isMorpho === true;
		case 'juiced':
			return inc?.isYearnJuiced === true;
		case 'gimme':
			return inc?.isGimme === true;
		case 'pooltogether':
			return inc?.isPoolTogether === true;
		case 'v3':
			return vault.v3 === true;
		case 'v2':
			return vault.v3 !== true;
		case 'retired':
			return vault.isRetired;
		case 'all':
			return true;
		default:
			return vault.origin === filter || (vault.category || '').toLowerCase() === filter;
	}
}

function useFetchYearnVaults(vaultFilter: TPossibleVaultFilter, chainIDs?: number[] | undefined): TUseFetchYearnVaults {
	const allChainIds = supportedNetworks.map(chain => chain.id);
	const allowedChainIDs = chainIDs || allChainIds;

	const {
		data: rawVaults,
		isLoading,
		mutate
	} = useFetch<TKongVault[]>({
		endpoint: `${process.env.KONG_API_BASE_URI}/list/vaults`,
		schema: kongVaultListSchema
	});

	const vaultsObject = useDeepCompareMemo((): TDict<TYDaemonVault> => {
		const allowedSet = new Set(allowedChainIDs);
		return (rawVaults ?? []).reduce((acc: TDict<TYDaemonVault>, kongVault): TDict<TYDaemonVault> => {
			if (!allowedSet.has(kongVault.chainId)) {
				return acc;
			}
			if (kongVault.migration === true) {
				return acc;
			}
			if (kongVault.isHidden) {
				return acc;
			}
			if (!matchesFilter(kongVault, vaultFilter)) {
				return acc;
			}
			const vault = mapKongToVault(kongVault);
			acc[toAddress(vault.address)] = vault;
			return acc;
		}, {});
	}, [rawVaults, allowedChainIDs, vaultFilter]);

	// SWR mutator typed for the return interface
	const typedMutate = mutate as unknown as TUseFetchYearnVaults['mutate'];

	return {
		vaults: vaultsObject,
		isLoading,
		mutate: typedMutate
	};
}

export {useFetchYearnVaults};
