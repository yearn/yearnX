import {type ReactElement, useEffect, useMemo, useState} from 'react';
import {useQueryState} from 'nuqs';
import {VAULTS_PER_PAGE} from 'packages/pendle/constants';
import {zeroNormalizedBN} from '@builtbymom/web3/utils';
import {usePrices} from '@lib/contexts/usePrices';
import {useSortedVaults} from '@lib/hooks/useSortedVaults';
import {useVaultsPagination} from '@lib/hooks/useVaultsPagination';
import {acknowledge} from '@lib/utils/tools';

import {Pagination} from './Pagination';
import {Skeleton} from './Skeleton';
import {VaultItem} from './VaultItem';
import {VaultSearch} from './VaultSearch';
import {VaultsListHead} from './VaultsListHead';

import type {TDict, TNDict, TNormalizedBN, TToken} from '@builtbymom/web3/types';
import type {TYDaemonVaults} from '@lib/hooks/useYearnVaults.types';
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

export const VaultList = (props: TVaultListProps): ReactElement => {
	const [searchValue, set_searchValue] = useQueryState('search', {defaultValue: '', shallow: true});
	const {getPrices, pricingHash} = usePrices();
	const [allPrices, set_allPrices] = useState<TNDict<TDict<TNormalizedBN>>>({});

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

	const {vaults, goToNextPage, goToPrevPage, goToPage, currentPage, amountOfPages} = useVaultsPagination(
		VAULTS_PER_PAGE,
		searchValue ? filteredVaults : props.vaults
	);

	const sort = useSortedVaults(vaults, allPrices, props.options);

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

		if (sort.sortedVaults?.length) {
			return (
				<div className={'flex flex-col gap-y-3'}>
					{sort.sortedVaults.map(vault => (
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
};
