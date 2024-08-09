import {useMemo} from 'react';
import {useQueryState} from 'nuqs';
import {serialize} from 'wagmi';
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
	onSortBy: (sortBy: TVaultsSortBy) => void;
	onSortDirection: (sortDirection: TSortDirection) => void;
};
export const useSortedVaults = (vaults: TYDaemonVaults, allPrices: TNDict<TDict<TNormalizedBN>>): TSortedVaults => {
	const {balances, getBalance} = useWallet();
	const {pricingHash} = usePrices();
	const [sortDirection, set_sortDirection] = useQueryState('sortDirection', {defaultValue: '', shallow: true});
	const [sortBy, set_sortBy] = useQueryState('sortBy', {
		defaultValue: 'balance',
		shallow: true,
		clearOnDefault: true
	});

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
	 ** The sortedByBalance memoized value will return the vaults sorted by APR.
	 **
	 ** @params void
	 ** @returns TYDaemonVaults - The sorted vaults.
	 *********************************************************************************************/
	const sortedByAPR = useMemo((): TYDaemonVaults => {
		if (sortBy !== 'apr') {
			return vaults;
		}
		return vaults?.length
			? vaults.toSorted((a, b): number =>
					numberSort({
						a: a.apr.netAPR || 0,
						b: b.apr.netAPR || 0,
						sortDirection: sortDirection as TSortDirection
					})
				)
			: [];
	}, [sortBy, vaults, sortDirection]);

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
		pricingHash;
		currentBalanceIdentifier;
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
	}, [pricingHash, currentBalanceIdentifier, sortBy, vaults, allPrices, getBalance, sortDirection]);

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
		if (sortBy === 'apr') {
			return sortedByAPR;
		}

		if (sortBy === 'deposits') {
			return sortedByDeposits;
		}

		if (sortBy === 'balance') {
			return sortedByBalance;
		}
		return sortedByBalance;
	}, [sortBy, sortDirection, sortedByAPR, sortedByBalance, sortedByDeposits]);

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
