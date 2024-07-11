import {type ReactElement, useMemo, useState} from 'react';
import {VAULTS_PER_PAGE} from 'packages/pendle/constants';
import {zeroNormalizedBN} from '@builtbymom/web3/utils';
import {usePrices} from '@lib/contexts/usePrices';
import {useDebounce} from '@lib/hooks/useDebounce';
import {useSortedVaults} from '@lib/hooks/useSortedVaults';
import {useVaultsPagination} from '@lib/hooks/useVaultsPagination';

import {VaultsListHead} from '../VaultsListHead';
import {Pagination} from './Pagination';
import {Skeleton} from './Skeleton';
import {VaultItem} from './VaultItem';
import {VaultSearch} from './VaultSearch';

import type {TToken} from '@builtbymom/web3/types';
import type {TYDaemonVaults} from '@lib/hooks/useYearnVaults.types';

type TVaultListProps = {
	vaults: TYDaemonVaults;
	isLoading: boolean;
	headerTabs: {value: string; label: string; isSortable: boolean}[];
};

export const VaultList = (props: TVaultListProps): ReactElement => {
	const {getPrices, pricingHash} = usePrices();
	const [searchValue, set_searchValue] = useState('');
	const {debouncedValue} = useDebounce(searchValue, 400);

	const allPrices = useMemo(() => {
		const allTokens = props.vaults.map(vault => ({chainID: vault.chainID, address: vault.address}));
		return getPrices(allTokens as TToken[]);
	}, [props.vaults, getPrices, pricingHash]); // eslint-disable-line react-hooks/exhaustive-deps

	const filteredVaults = useMemo(() => {
		const filteredVaults = props.vaults?.filter(vault => {
			const lowercaseValue = debouncedValue.toLowerCase();
			return (
				vault.name.toLowerCase().includes(lowercaseValue) ||
				vault.address.toLowerCase().includes(lowercaseValue)
			);
		});

		return filteredVaults;
	}, [debouncedValue, props.vaults]);

	const {vaults, nextPage, prevPage, currentPage, amountOfPages} = useVaultsPagination(
		VAULTS_PER_PAGE,
		debouncedValue ? filteredVaults : props.vaults
	);

	const {sortBy, sortDirection, sortedVaults} = useSortedVaults(vaults, allPrices);

	const getLayout = (): ReactElement => {
		if (props.isLoading) {
			return <Skeleton />;
		}

		if (sortedVaults?.length) {
			return (
				<div className={'flex flex-col gap-y-3'}>
					{sortedVaults.map(vault => (
						<VaultItem
							key={vault.address}
							vault={vault}
							price={allPrices?.[vault.chainID]?.[vault.address] || zeroNormalizedBN}
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
					items={props.headerTabs}
					sortBy={sortBy}
					sortDirection={sortDirection}
					vaults={props.vaults}
				/>

				<div className={'mt-4'}>{getLayout()}</div>
			</div>

			<Pagination
				currentPage={currentPage}
				nextPage={nextPage}
				prevPage={prevPage}
				amountOfPages={amountOfPages}
			/>
		</div>
	);
};
