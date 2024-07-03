import {type ReactElement, useMemo} from 'react';
import {zeroNormalizedBN} from '@builtbymom/web3/utils';
import {usePrices} from '@lib/contexts/usePrices';
import {useSortedVaults} from '@lib/hooks/useSortedVaults';

import {VaultsListHead} from '../VaultsListHead';
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

	const {sortBy, sortDirection, sortedVaults} = useSortedVaults(props.vaults, allPrices);

	return (
		<div className={'md:bg-table w-full rounded-2xl md:p-6'}>
			<VaultsListHead
				items={props.headerTabs}
				sortBy={sortBy}
				sortDirection={sortDirection}
				vaults={props.vaults}
			/>

			<div className={'mt-4'}>
				{sortedVaults?.length ? (
					<div className={'flex flex-col gap-y-4'}>
						{sortedVaults.map(vault => (
							<VaultItem
								key={vault.address}
								vault={vault}
								price={allPrices?.[vault.chainID]?.[vault.address] || zeroNormalizedBN}
							/>
						))}
					</div>
				) : (
					<div
						className={
							'flex h-80 w-full items-center justify-center rounded-2xl bg-purple-100 py-10 text-lg md:bg-transparent'
						}>
						{'Nothing to display'}
					</div>
				)}
			</div>
		</div>
	);
};
