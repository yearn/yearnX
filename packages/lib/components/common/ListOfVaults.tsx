import {type ReactElement, useMemo} from 'react';
import {VAULTS_PER_PAGE} from 'packages/pendle/constants';
import {zeroNormalizedBN} from '@builtbymom/web3/utils';
import {usePrices} from '@lib/contexts/usePrices';
import {useSortedVaults} from '@lib/hooks/useSortedVaults';
import {useVaultsPagination} from '@lib/hooks/useVaultsPagination';

import {VaultsListHead} from '../VaultsListHead';
import {Pagination} from './Pagination';
import {Skeleton} from './Skeleton';
import {VaultItem} from './VaultItem';

import type {TToken} from '@builtbymom/web3/types';
import type {TYDaemonVaults} from '@lib/hooks/useYearnVaults.types';

type TListOfVaultsProps = {
	vaults: TYDaemonVaults;
	isLoading: boolean;
	headerTabs: {value: string; label: string; isSortable: boolean}[];
};

export const ListOfVaults = (props: TListOfVaultsProps): ReactElement => {
	const {getPrices, pricingHash} = usePrices();

	const allPrices = useMemo(() => {
		pricingHash;
		const allTokens = props.vaults.map(vault => ({chainID: vault.chainID, address: vault.address}));
		return getPrices(allTokens as TToken[]);
	}, [props.vaults, getPrices, pricingHash]);

	const {vaults, nextPage, prevPage, currentPage, amountOfPages} = useVaultsPagination(VAULTS_PER_PAGE, props.vaults);

	const {sortBy, sortDirection, sortedVaults} = useSortedVaults(vaults, allPrices);

	const getLayout = (): ReactElement => {
		if (props.isLoading) {
			return <Skeleton />;
		}

		if (sortedVaults?.length) {
			return (
				<div className={'flex flex-col gap-y-4'}>
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
