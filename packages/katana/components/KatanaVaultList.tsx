'use client';

import {Fragment, type ReactElement, useCallback, useEffect, useMemo, useState} from 'react';
import {useQueryState} from 'nuqs';
import {VAULTS_PER_PAGE} from 'packages/pendle/constants';
import {usePrices} from '@lib/contexts/usePrices';
import useWallet from '@lib/contexts/useWallet';
import {useSortedVaults} from '@lib/hooks/useSortedVaults';
import {useVaultsPagination} from '@lib/hooks/useVaultsPagination';
import {zeroNormalizedBN} from '@lib/utils';
import {acknowledge} from '@lib/utils/tools';

import {Pagination} from '../../lib/components/common/Pagination';
import {Skeleton} from '../../lib/components/common/Skeleton';
import {VaultItem} from './KatanaVaultItem';
import {VaultsListHead} from './KatanaVaultsListHead';

import type {TYDaemonVault, TYDaemonVaults} from '@lib/hooks/useYearnVaults.types';
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
	const [searchValue] = useQueryState('search', {defaultValue: '', shallow: true});
	const {getPrices, pricingHash} = usePrices();
	const [allPrices, set_allPrices] = useState<TNDict<TDict<TNormalizedBN>>>({});

	const {balanceHash, getBalance} = useWallet();

	useEffect(() => {
		acknowledge(pricingHash);
		const allTokens = props.vaults.map(vault => ({chainID: vault.chainID, address: vault.address}));
		set_allPrices(getPrices(allTokens as TToken[]));
	}, [pricingHash, props.vaults, getPrices]);

	const filteredVaults = useMemo(() => {
		return props.vaults?.filter(vault => {
			const lowercaseValue = searchValue.toLowerCase();
			return (
				vault.name.toLowerCase().includes(lowercaseValue) ||
				vault.address.toLowerCase().includes(lowercaseValue) ||
				vault.symbol.toLowerCase().includes(lowercaseValue)
			);
		});
	}, [searchValue, props.vaults]);

	const allVaults = searchValue ? filteredVaults : props.vaults;

	const vaultsWithBalance = useMemo(() => {
		acknowledge(balanceHash);
		const values = allVaults.filter(vault => {
			const balance = getBalance({address: vault.address, chainID: vault.chainID}).normalized || 0;
			return balance > 0;
		});

		return values.sort((a, b) => {
			if (a.chainID === 747474 && b.chainID !== 747474) {
				return -1;
			}
			if (a.chainID !== 747474 && b.chainID === 747474) {
				return 1;
			}
			return (
				getBalance({address: b.address, chainID: b.chainID}).normalized -
				getBalance({address: a.address, chainID: a.chainID}).normalized
			);
		});
	}, [balanceHash, allVaults, getBalance]);

	const vaultsWithNoBalance = useMemo(() => {
		acknowledge(balanceHash);
		const values = allVaults.filter(vault => {
			const balance = getBalance({address: vault.address, chainID: vault.chainID}).normalized || 0;
			return balance === 0;
		});
		return values.sort((a, b) => {
			if (a.chainID === 747474 && b.chainID !== 747474) {
				return -1;
			}
			if (a.chainID !== 747474 && b.chainID === 747474) {
				return 1;
			}
			return b.featuringScore - a.featuringScore;
		});
	}, [balanceHash, allVaults, getBalance]);

	const getEffectiveApr = useCallback(
		(vault: TYDaemonVault) => {
			return vault.apr.netAPR;
		},
		[]
	);

	const sortOptions = useMemo(
		() => ({...props.options, getEffectiveApr}),
		[props.options, getEffectiveApr]
	);

	const {sortedVaults: sortedVaultsWithBalance} = useSortedVaults(vaultsWithBalance, allPrices, sortOptions);
	const sort = useSortedVaults(vaultsWithNoBalance, allPrices, sortOptions);

	const {vaults, goToNextPage, goToPrevPage, goToPage, currentPage, amountOfPages} = useVaultsPagination(
		VAULTS_PER_PAGE,
		[...(sortedVaultsWithBalance || []), ...(sort.sortedVaults || [])]
	);

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
