import {type ReactElement, useCallback} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
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
	const router = useRouter();
	const searchParams = useSearchParams();
	const currentPage = searchParams.get('page') ?? 1;

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
		<div className={'hidden px-2 md:col-span-7 md:grid md:grid-cols-7'}>
			{props.items.map(item =>
				item.isSortable ? (
					<button
						onClick={() =>
							router.push(
								`?page=${currentPage}&sortDirection=${toggleSortDirection(item.value)}&sortBy=${item.value}`
							)
						}
						className={cl(
							'flex w-full items-center gap-x-2',
							item.value === 'deposits' || item.value === 'balance' || item.value === 'apr'
								? 'justify-end'
								: 'justify-center'
						)}
						key={item.label}>
						<IconSort className={'text-regularText/80 size-3'} />
						<p className={'text-regularText/80 text-right'}>{item.label}</p>
					</button>
				) : (
					<div
						key={item.value}
						className={cl(
							'flex flex-row items-center text-regularText/80',
							item.value === 'vault'
								? 'col-span-2 justify-start'
								: item.value === 'manage'
									? 'justify-center col-span-2'
									: 'justify-end'
						)}>
						{item.label}
					</div>
				)
			)}
		</div>
	);
};
