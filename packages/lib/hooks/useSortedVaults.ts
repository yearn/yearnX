'use client';

import {useMemo} from 'react';
import {useQueryState} from 'nuqs';
import {usePrices} from '@lib/contexts/usePrices';
import useWallet from '@lib/contexts/useWallet';
import {numberSort} from '@lib/utils';
import {acknowledge} from '@lib/utils/tools';

import type {TDict, TNDict, TNormalizedBN, TSortDirection} from '@lib/types';
import type {TAPYType, TVaultsSortBy} from '@lib/utils/types';
import type {TYDaemonVaults} from './useYearnVaults.types';

type TSortedVaults = {
	sortBy: TVaultsSortBy;
	sortDirection: TSortDirection;
	sortedVaults: TYDaemonVaults | undefined;
	onSortBy: (sortBy: TVaultsSortBy) => void;
	onSortDirection: (sortDirection: TSortDirection) => void;
};
export const useSortedVaults = (
	vaults: TYDaemonVaults,
	allPrices: TNDict<TDict<TNormalizedBN>>,
	options?: {
		apyType: TAPYType;
	}
): TSortedVaults => {
	const {balanceHash, getBalance} = useWallet();
	const {pricingHash} = usePrices();
	const [sortDirection, set_sortDirection] = useQueryState('sortDirection', {
		defaultValue: '',
		shallow: true,
		clearOnDefault: true
	});
	const [sortBy, set_sortBy] = useQueryState('sortBy', {
		defaultValue: '',
		shallow: true,
		clearOnDefault: true
	});

	/**********************************************************************************************
	 ** The sortedByBalance memoized value will return the vaults sorted by APY.
	 **
	 ** @params void
	 ** @returns TYDaemonVaults - The sorted vaults.
	 *********************************************************************************************/
	const sortedByAPY = useMemo((): TYDaemonVaults => {
		if (sortBy !== 'apy') {
			return vaults;
		}
		return vaults?.length
			? vaults.toSorted((a, b): number =>
					numberSort({
						a: options?.apyType === 'ESTIMATED' ? a.apr.forwardAPR.netAPR || 0 : a.apr.netAPR || 0,
						b: options?.apyType === 'ESTIMATED' ? b.apr.forwardAPR.netAPR || 0 : b.apr.netAPR || 0,
						sortDirection: sortDirection as TSortDirection
					})
				)
			: [];
	}, [sortBy, vaults, options?.apyType, sortDirection]);

	/**********************************************************************************************
	 ** The sortedByBalance memoized value will return the vaults sorted by TVL.
	 **
	 ** @params void
	 ** @returns TYDaemonVaults - The sorted vaults.
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
	 ** The sortedByBalance memoized value will return the vaults sorted by balance, based on the
	 ** current balance and the price of the vault. This is the default sorting method.
	 **
	 ** @params void
	 ** @returns TYDaemonVaults - The sorted vaults.
	 *********************************************************************************************/
	const sortedByBalance = useMemo((): TYDaemonVaults => {
		acknowledge(pricingHash, balanceHash);
		if (!sortBy || sortBy !== 'balance') {
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
	}, [pricingHash, balanceHash, sortBy, vaults, allPrices, getBalance, sortDirection]);

	/**********************************************************************************************
	 ** The sortedVaults memoized value will return the sorted vaults based on the sortBy value,
	 ** returning the llist of vaults matching it.
	 **
	 ** @params void
	 ** @returns TYDaemonVaults - The sorted vaults.
	 *********************************************************************************************/
	const sortedVaults = useMemo(() => {
		if (sortDirection === '') {
			return sortedByBalance;
		}
		if (sortBy === 'apy') {
			return sortedByAPY;
		}

		if (sortBy === 'deposits') {
			return sortedByDeposits;
		}

		if (sortBy === 'balance') {
			return sortedByBalance;
		}
		return sortedByBalance;
	}, [sortBy, sortDirection, sortedByAPY, sortedByBalance, sortedByDeposits]);

	/**********************************************************************************************
	 ** onSortBy will update the sortBy state with a provided value.
	 **
	 ** @params value: TVaultsSortBy - The value to update the sortBy state with.
	 ** @returns void
	 *********************************************************************************************/
	const onSortBy = (value: TVaultsSortBy): void => {
		set_sortBy(value);
	};

	/**********************************************************************************************
	 ** onSortDirection will update the sortDirection state with a provided value.
	 **
	 ** @params value: TSortDirection - The value to update the sortDirection state with.
	 ** @returns void
	 *********************************************************************************************/
	const onSortDirection = (value: TSortDirection): void => {
		set_sortDirection(value);
	};

	return {
		sortBy: sortBy as TVaultsSortBy,
		sortDirection: sortDirection as TSortDirection,
		sortedVaults,
		onSortBy,
		onSortDirection
	};
};
