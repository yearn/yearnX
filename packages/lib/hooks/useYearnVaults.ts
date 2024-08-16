import {useFetch} from '@builtbymom/web3/hooks/useFetch';
import {toAddress} from '@builtbymom/web3/utils';
import {useDeepCompareMemo} from '@react-hookz/web';

import {yDaemonVaultsSchema} from './useYearnVaults.types';

import type {TDict} from '@builtbymom/web3/types';
import type {TPossibleVaultFilter, TUseFetchYearnVaults, TYDaemonVault, TYDaemonVaults} from './useYearnVaults.types';

function useFetchYearnVaults(vaultFilter: TPossibleVaultFilter, chainIDs?: number[] | undefined): TUseFetchYearnVaults {
	const {
		data: vaults,
		isLoading,
		mutate
	} = useFetch<TYDaemonVaults>({
		endpoint: `https://ydaemon.yearn.fi/vaults/${vaultFilter}?${new URLSearchParams({
			hideAlways: 'true',
			orderBy: 'featuringScore',
			orderDirection: 'desc',
			strategiesDetails: 'withDetails',
			strategiesCondition: 'inQueue',
			chainIDs: chainIDs ? chainIDs.join(',') : [1, 10, 100, 137, 250, 8453, 42161].join(','),
			limit: '2500'
		})}`,
		schema: yDaemonVaultsSchema
	});

	const vaultsObject = useDeepCompareMemo((): TDict<TYDaemonVault> => {
		const _vaultsObject = (vaults ?? []).reduce((acc: TDict<TYDaemonVault>, vault): TDict<TYDaemonVault> => {
			if (!vault.migration.available) {
				acc[toAddress(vault.address)] = vault;
			}
			return acc;
		}, {});
		return _vaultsObject;
	}, [vaults]);

	return {
		vaults: vaultsObject,
		isLoading,
		mutate
	};
}

export {useFetchYearnVaults};
