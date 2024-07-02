import {VaultsListHead} from '../VaultsListHead';
import {VaultItem} from './VaultItem';

import type {ReactElement} from 'react';
import type {TYDaemonVaults} from '@lib/hooks/useYearnVaults.types';

type TListOfVaultsProps = {
	vaults: TYDaemonVaults;
	headerTabs: {value: string; label: string; isSortable: boolean}[];
};

export const ListOfVaults = (props: TListOfVaultsProps): ReactElement => {
	return (
		<div className={'md:bg-table w-full rounded-2xl md:p-6'}>
			<VaultsListHead
				items={props.headerTabs}
				sortBy={''}
				sortDirection={''}
			/>

			<div className={'mt-4'}>
				{props.vaults?.length ? (
					<div className={'flex flex-col gap-y-4'}>
						{props.vaults.map(vault => (
							<VaultItem vault={vault} />
						))}
					</div>
				) : (
					<div className={'flex w-full items-center justify-center py-10 text-lg'}>
						{'Nothing to display'}
					</div>
				)}
			</div>
		</div>
	);
};
