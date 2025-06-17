'use client';

import {Fragment, type ReactElement, useEffect, useMemo, useState} from 'react';
import {useQueryState} from 'nuqs';
import {VAULTS_PER_PAGE} from 'packages/pendle/constants';
import {usePrices} from '@lib/contexts/usePrices';
import useWallet from '@lib/contexts/useWallet';
import {useSortedVaults} from '@lib/hooks/useSortedVaults';
import {useVaultsPagination} from '@lib/hooks/useVaultsPagination';
import {zeroNormalizedBN} from '@lib/utils';
import {acknowledge} from '@lib/utils/tools';

import {Pagination} from './Pagination';
import {Skeleton} from './Skeleton';
import {VaultItem} from './VaultItem';
import {VaultSearch} from './VaultSearch';
import {VaultsListHead} from './VaultsListHead';

import type {TYDaemonVaults} from '@lib/hooks/useYearnVaults.types';
import type {TDict, TNDict, TNormalizedBN, TToken} from '@lib/types';
import type {TAPYType} from '@lib/utils/types';

type TVaultListProps = {
	vaults: TYDaemonVaults;
	isLoading: boolean;
	options?: {
		apyType: TAPYType;
		shouldDisplaySubAPY?: boolean;
	};
};

const HEADER_TABS = [
	{value: 'vault', label: 'Vault', isSortable: false},
	{value: 'apy', label: 'APY', isSortable: true},
	{value: 'deposits', label: 'TVL', isSortable: true},
	{value: 'balance', label: 'My Balance', isSortable: true},
	{value: 'manage', label: 'Manage', isSortable: false}
];

function VaultListContent(props: TVaultListProps): ReactElement {
	const [searchValue, set_searchValue] = useQueryState('search', {defaultValue: '', shallow: true});
	const {getPrices, pricingHash} = usePrices();
	const [allPrices, set_allPrices] = useState<TNDict<TDict<TNormalizedBN>>>({});

	const {balanceHash, getBalance} = useWallet();

	/**********************************************************************************************
	 ** useEffect hook to retrieve and memoize prices for all tokens associated with the vaults.
	 ** - Constructs an array of tokens from `props.vaults` containing chain IDs and addresses.
	 ** - Uses `getPrices` to fetch prices for these tokens.
	 *********************************************************************************************/
	useEffect(() => {
		acknowledge(pricingHash);
		const allTokens = props.vaults.map(vault => ({chainID: vault.chainID, address: vault.address}));
		set_allPrices(getPrices(allTokens as TToken[]));
	}, [pricingHash, props.vaults, getPrices]);

	/**********************************************************************************************
	 ** useMemo hook to filter vaults based on a debounced search value.
	 ** - Filters the `props.vaults` array based on whether each vault's name, address, or symbol
	 ** includes the lowercase version of the `debouncedValue`.
	 *********************************************************************************************/
	const filteredVaults = useMemo(() => {
		const filteredVaults = props.vaults?.filter(vault => {
			const lowercaseValue = searchValue.toLowerCase();
			return (
				vault.name.toLowerCase().includes(lowercaseValue) ||
				vault.address.toLowerCase().includes(lowercaseValue) ||
				vault.symbol.toLowerCase().includes(lowercaseValue)
			);
		});

		return filteredVaults;
	}, [searchValue, props.vaults]);

	const allVaults = searchValue ? filteredVaults : props.vaults;

	/**********************************************************************************************
	 * useMemo hook to filter vaults with non-zero balance.
	 * - Acknowledges the balanceHash to trigger re-computation when balances change.
	 * - Filters vaultsToUse array based on whether each vault has a positive balance.
	 * - Uses getBalance function to retrieve the normalized balance for each vault.
	 * - Returns an array of vaults where the user has a non-zero balance.
	 *********************************************************************************************/
	const vaultsWithBalance = useMemo(() => {
		acknowledge(balanceHash);
		const values = allVaults.filter(vault => {
			const balance = getBalance({address: vault.address, chainID: vault.chainID}).normalized || 0;
			return balance > 0;
		});

		// Sort by balance by default
		return values.sort(
			(a, b) =>
				getBalance({address: b.address, chainID: b.chainID}).normalized -
				getBalance({address: a.address, chainID: a.chainID}).normalized
		);
	}, [balanceHash, allVaults, getBalance]);

	/**********************************************************************************************
	 * useMemo hook to filter vaults with zero balance.
	 * - Acknowledges the balanceHash to trigger re-computation when balances change.
	 * - Filters allVaults array based on whether each vault has a zero balance.
	 * - Uses getBalance function to retrieve the normalized balance for each vault.
	 * - Returns an array of vaults where the user has a zero balance.
	 *********************************************************************************************/
	const vaultsWithNoBalance = useMemo(() => {
		acknowledge(balanceHash);
		const values = allVaults.filter(vault => {
			const balance = getBalance({address: vault.address, chainID: vault.chainID}).normalized || 0;
			return balance === 0;
		});
		// Sort by featuringScore by default
		return values.sort((a, b) => b.featuringScore - a.featuringScore);
	}, [balanceHash, allVaults, getBalance]);

	const {sortedVaults: sortedVaultsWithBalance} = useSortedVaults(vaultsWithBalance, allPrices, props.options);
	const sort = useSortedVaults(vaultsWithNoBalance, allPrices, props.options);

	const {vaults, goToNextPage, goToPrevPage, goToPage, currentPage, amountOfPages} = useVaultsPagination(
		VAULTS_PER_PAGE,
		[...(sortedVaultsWithBalance || []), ...(sort.sortedVaults || [])]
	);

	/**********************************************************************************************
	 ** Generates the layout based on the current props and state.
	 ** - Returns a loading skeleton if `props.isLoading` is true.
	 ** - Renders sorted vault items if `sortedVaults` has items.
	 ** - Displays a message if there are no items to display.
	 *********************************************************************************************/
	const getLayout = (): ReactElement => {
		if (props.isLoading) {
			return <Skeleton />;
		}

		if (vaults.length) {
			return (
				<div className={'flex flex-col gap-y-3'}>
					{vaults.map(vault => (
						<VaultItem
							key={vault.address}
							vault={vault}
							price={allPrices?.[vault.chainID]?.[vault.address] || zeroNormalizedBN}
							options={props.options}
						/>
					))}
				</div>
			);
		}

		return (
			<div
				className={
					'bg-table flex h-80 w-full items-center justify-center rounded-2xl py-10 text-lg md:bg-transparent'
				}>
				{'Nothing to display'}
			</div>
		);
	};

	return (
		<div className={'md:pb-10'}>
			<div className={'md:bg-table w-full rounded-2xl md:p-6'}>
				<VaultSearch
					searchValue={searchValue}
					set_searchValue={set_searchValue}
				/>
				<VaultsListHead
					items={HEADER_TABS}
					sortBy={sort.sortBy}
					sortDirection={sort.sortDirection}
					onSortBy={sort.onSortBy}
					onSortDirection={sort.onSortDirection}
					vaults={props.vaults}
				/>

				<div className={'mt-4'}>{getLayout()}</div>
			</div>

			<Pagination
				currentPage={currentPage}
				goToNextPage={goToNextPage}
				goToPrevPage={goToPrevPage}
				goToPage={goToPage}
				amountOfPages={amountOfPages}
			/>
		</div>
	);
}

export function VaultList(props: TVaultListProps): ReactElement {
	const [isMounted, set_isMounted] = useState(false);

	useEffect(() => {
		set_isMounted(true);
	}, []);

	return isMounted ? <VaultListContent {...props} /> : <Fragment />;
}
