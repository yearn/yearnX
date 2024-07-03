import {useEffect, useMemo} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {deserialize, serialize} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {numberSort} from '@builtbymom/web3/utils';
import {usePrices} from '@lib/contexts/usePrices';
import {createUniqueID} from '@lib/utils/tools.identifiers';

import type {TDict, TNDict, TNormalizedBN, TSortDirection} from '@builtbymom/web3/types';
import type {TVaultsSortBy} from '@lib/utils/types';
import type {TYDaemonVaults} from './useYearnVaults.types';

type TSortedVaults = {
	sortBy: TVaultsSortBy;
	sortDirection: TSortDirection;
	sortedVaults: TYDaemonVaults | undefined;
};
export const useSortedVaults = (vaults: TYDaemonVaults, allPrices: TNDict<TDict<TNormalizedBN>>): TSortedVaults => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const {pricingHash} = usePrices();
	const {balances, getBalance} = useWallet();
	const sortDirection = searchParams.get('sortDirection');
	const sortBy = searchParams.get('sortBy');
	const currentPage = searchParams.get('page') ?? 1;

	/**********************************************************************************************
	 ** Balances is an object with multiple level of depth. We want to create a unique hash from
	 ** it to know when it changes. This new hash will be used to trigger the useEffect hook.
	 ** We will use classic hash function to create a hash from the balances object.
	 *********************************************************************************************/
	const currentBalanceIdentifier = useMemo(() => {
		const hash = createUniqueID(serialize(balances));
		return hash;
	}, [balances]);

	/**********************************************************************************************
	 ** If sortDirection is empty we show the array in original order, and also we need to clean the
	 ** url.
	 *********************************************************************************************/
	useEffect(() => {
		if (!sortDirection && sortBy) {
			router.push(`?page=${currentPage}`);
		}
	}, [currentPage, router, sortBy, sortDirection]);

	/**********************************************************************************************
	 ** This is memoized sorted vaults by apr.
	 *********************************************************************************************/
	const sortedByAPR = useMemo((): TYDaemonVaults => {
		if (sortBy !== 'apr') {
			return vaults;
		}
		return vaults?.length
			? vaults.toSorted((a, b): number =>
					numberSort({
						a: a.apr.extra.stakingRewardsAPR || 0,
						b: b.apr.extra.stakingRewardsAPR || 0,
						sortDirection: sortDirection as TSortDirection
					})
				)
			: [];
	}, [sortBy, vaults, sortDirection]);

	/**********************************************************************************************
	 ** This is memoized sorted by spender allowances.
	 *********************************************************************************************/
	const sortedByDeposits = useMemo((): TYDaemonVaults => {
		if (sortBy !== 'deposits') {
			return vaults;
		}
		return vaults?.length
			? vaults.toSorted((a, b): number => {
					return numberSort({
						a: a.tvl.tvl,
						b: b.tvl.tvl,
						sortDirection: sortDirection as TSortDirection
					});
				})
			: [];
	}, [sortBy, vaults, sortDirection]);

	/**********************************************************************************************
	 ** This is memoized sorted by balance.
	 *********************************************************************************************/
	const sortedByBalance = useMemo((): TYDaemonVaults => {
		pricingHash;
		currentBalanceIdentifier;
		if (sortBy !== 'balance') {
			return vaults;
		}
		return vaults?.length
			? vaults.toSorted((a, b): number => {
					const priceOfA = allPrices?.[a.chainID]?.[a.address] || 0;
					const priceOfB = allPrices?.[b.chainID]?.[b.address] || 0;
					const balanceOfA = getBalance({chainID: a.chainID, address: a.address});
					const balanceOfB = getBalance({chainID: b.chainID, address: b.address});
					const sortByA = balanceOfA.normalized * (priceOfA?.normalized || 0);
					const sortByB = balanceOfB.normalized * (priceOfB?.normalized || 0);

					return numberSort({
						a: sortByA || 0,
						b: sortByB || 0,
						sortDirection: sortDirection as TSortDirection
					});
				})
			: [];
	}, [pricingHash, currentBalanceIdentifier, sortBy, vaults, allPrices, getBalance, sortDirection]);

	const stringifiedSortList = serialize(vaults) ?? '{}';

	/**********************************************************************************************
	 ** This is memoized sorted allowances that contains allowances according to sortBy state.
	 *********************************************************************************************/
	const sortedVaults = useMemo(() => {
		const sortResult = deserialize(stringifiedSortList) as TYDaemonVaults;
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
	}, [sortBy, sortDirection, sortedByAPR, sortedByBalance, sortedByDeposits, stringifiedSortList]);

	return {
		sortBy: sortBy as TVaultsSortBy,
		sortDirection: sortDirection as TSortDirection,
		sortedVaults
	};
};
