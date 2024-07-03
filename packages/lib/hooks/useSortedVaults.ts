import {useEffect, useMemo} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {deserialize, serialize} from 'wagmi';
import {numberSort, toNormalizedBN} from '@builtbymom/web3/utils';

import type {TSortDirection} from '@builtbymom/web3/types';
import type {TVaultsSortBy} from '@lib/utils/types';
import type {TYDaemonVaults} from './useYearnVaults.types';

export const useSortedVaults = (
	vaults: TYDaemonVaults
): {
	sortBy: TVaultsSortBy;
	sortDirection: TSortDirection;
	sortedVaults: TYDaemonVaults | undefined;
} => {
	const router = useRouter();
	const searchParams = useSearchParams();

	const sortDirection = searchParams.get('sortDirection');
	const sortBy = searchParams.get('sortBy');

	/**********************************************************************************************
	 ** If sortDirection is empty we show the array in original order, and also we need to clean the
	 ** url.
	 *********************************************************************************************/
	useEffect(() => {
		if (!sortDirection && sortBy) {
			router.push('');
		}
	}, [router, sortBy, sortDirection]);

	/**********************************************************************************************
	 ** This is memoized sorted vaults by apr.
	 *********************************************************************************************/
	const sortedByAPR = useMemo((): TYDaemonVaults => {
		return vaults?.length
			? vaults.toSorted((a, b): number =>
					numberSort({
						a: a.apr.extra.stakingRewardsAPR || 0,
						b: b.apr.extra.stakingRewardsAPR || 0,
						sortDirection: sortDirection as TSortDirection
					})
				)
			: [];
	}, [vaults, sortDirection]);

	/**********************************************************************************************
	 ** This is memoized sorted by spender allowances.
	 *********************************************************************************************/
	const sortedByDeposits = useMemo((): TYDaemonVaults => {
		return vaults?.length
			? vaults.toSorted((a, b): number => {
					return numberSort({
						a: a.tvl.tvl,
						b: b.tvl.tvl,
						sortDirection: sortDirection as TSortDirection
					});
				})
			: [];
	}, [vaults, sortDirection]);

	/**********************************************************************************************
	 ** This is memoized sorted by balance.
	 *********************************************************************************************/
	const sortedByBalance = useMemo((): TYDaemonVaults => {
		return vaults?.length
			? vaults.toSorted((a, b): number => {
					const sortByA = toNormalizedBN(a.tvl.totalAssets, a.token.decimals).normalized;
					const sortByB = toNormalizedBN(b.tvl.totalAssets, b.token.decimals).normalized;

					return numberSort({
						a: sortByA || 0,
						b: sortByB || 0,
						sortDirection: sortDirection as TSortDirection
					});
				})
			: [];
	}, [vaults, sortDirection]);
	const stringifiedAllowancesList = serialize(vaults) ?? '{}';

	/**********************************************************************************************
	 ** This is memoized sorted allowances that contains allowances according to sortBy state.
	 *********************************************************************************************/
	const sortedVaults = useMemo(() => {
		const sortResult = deserialize(stringifiedAllowancesList) as TYDaemonVaults;
		if (sortDirection === '') {
			return sortResult;
		}
		if (sortBy === 'apr') {
			return sortedByAPR;
		}

		if (sortBy === 'deposits') {
			return sortedByDeposits;
		}

		if (sortBy === 'balance') {
			return sortedByBalance;
		}
		return sortResult;
	}, [sortBy, sortDirection, sortedByAPR, sortedByBalance, sortedByDeposits, stringifiedAllowancesList]);

	return {
		sortBy: sortBy as TVaultsSortBy,
		sortDirection: sortDirection as TSortDirection,
		sortedVaults
	};
};
