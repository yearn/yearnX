import {type ReactElement} from 'react';
import Link from 'next/link';
import {cl} from '@builtbymom/web3/utils';
import {useSortedVaults} from '@lib/hooks/useSortedVaults';

import {IconSort} from './icons/IconSort';

import type {TSortDirection} from '@builtbymom/web3/types';
import type {TYDaemonVaults} from '@lib/hooks/useYearnVaults.types';

type TVaultsListHeadProps = {
	items: {
		label: string;
		isSortable: boolean;
		value: string;
	}[];
	sortBy: string;
	sortDirection: string;
	vaults: TYDaemonVaults;
};

export const VaultsListHead = (props: TVaultsListHeadProps): ReactElement => {
	const {sortBy, sortDirection} = useSortedVaults(props.vaults);
	/**********************************************************************************************
	 ** This toggleSortDirection function changes sort direction between asc, desc and 'no-sort'.
	 *********************************************************************************************/
	const toggleSortDirection = (newSortBy: string): TSortDirection => {
		if (sortBy === newSortBy) {
			if (sortDirection === '') {
				return 'desc';
			}
			if (sortDirection === 'desc') {
				return 'asc';
			}
			if (sortDirection === 'asc') {
				return '';
			}
		}
		return 'desc';
	};

	return (
		<div className={'hidden px-2 text-neutral-600 md:col-span-7 md:grid md:grid-cols-5'}>
			{props.items.map(item =>
				item.isSortable ? (
					<Link
						href={`?sortDirection=${toggleSortDirection(item.value)}&sortBy=${item.value}`}
						className={'flex w-full items-center justify-center gap-x-2'}
						key={item.label}>
						<IconSort className={'size-3'} />
						<p className={'text-white'}>{item.label}</p>
					</Link>
				) : (
					<div
						key={item.value}
						className={cl(
							'flex flex-row items-center text-white',
							item.value === 'vault' ? 'justify-start' : 'justify-center'
						)}>
						{item.label}
					</div>
				)
			)}
		</div>
	);
};
