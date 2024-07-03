import {type ReactElement, useCallback} from 'react';
import Link from 'next/link';
import {cl} from '@builtbymom/web3/utils';

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
	/**********************************************************************************************
	 ** This toggleSortDirection function changes sort direction between asc, desc and 'no-sort'.
	 *********************************************************************************************/
	const toggleSortDirection = useCallback(
		(newSortBy: string): TSortDirection => {
			if (props.sortBy === newSortBy) {
				if (props.sortDirection === '') {
					return 'desc';
				}
				if (props.sortDirection === 'desc') {
					return 'asc';
				}
				if (props.sortDirection === 'asc') {
					return '';
				}
			}
			return 'desc';
		},
		[props.sortBy, props.sortDirection]
	);

	return (
		<div className={'hidden px-2 text-neutral-600 md:col-span-7 md:grid md:grid-cols-6'}>
			{props.items.map(item =>
				item.isSortable ? (
					<Link
						href={`?sortDirection=${toggleSortDirection(item.value)}&sortBy=${item.value}`}
						className={cl(
							'flex w-full items-center gap-x-2',
							item.value === 'vault'
								? 'justify-start'
								: item.value === 'deposits'
									? 'justify-end'
									: item.value === 'balance'
										? 'justify-end'
										: 'justify-center'
						)}
						key={item.label}>
						<IconSort className={'size-3'} />
						<p className={'text-white'}>{item.label}</p>
					</Link>
				) : (
					<div
						key={item.value}
						className={cl(
							'flex flex-row items-center text-white',
							item.value === 'vault'
								? 'col-span-2 justify-start'
								: item.value === 'deposits'
									? 'justify-end'
									: item.value === 'balance'
										? 'justify-end'
										: 'justify-center'
						)}>
						{item.label}
					</div>
				)
			)}
		</div>
	);
};
