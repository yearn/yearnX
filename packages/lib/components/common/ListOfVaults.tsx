import {useSortedVaults} from '@lib/hooks/useSortedVaults';

import {VaultsListHead} from '../VaultsListHead';
import {VaultItem} from './VaultItem';

import type {ReactElement} from 'react';
import type {TYDaemonVaults} from '@lib/hooks/useYearnVaults.types';

type TListOfVaultsProps = {
	vaults: TYDaemonVaults;
	headerTabs: {value: string; label: string; isSortable: boolean}[];
};

export const ListOfVaults = (props: TListOfVaultsProps): ReactElement => {
	const {sortedVaults} = useSortedVaults(props.vaults);
	return (
		<div className={'md:bg-table w-full rounded-2xl md:p-6'}>
			<VaultsListHead
				items={props.headerTabs}
				sortBy={''}
				sortDirection={''}
				vaults={props.vaults}
			/>

			<div className={'mt-4'}>
				{sortedVaults?.length ? (
					<div className={'flex flex-col gap-y-4'}>
						{sortedVaults.map(vault => (
							<VaultItem
								key={vault.address}
								vault={vault}
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
