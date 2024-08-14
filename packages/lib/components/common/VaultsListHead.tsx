import {type ReactElement, useCallback} from 'react';
import {cl} from '@builtbymom/web3/utils';

import {IconSort} from '../icons/IconSort';

import type {TSortDirection} from '@builtbymom/web3/types';
import type {TYDaemonVaults} from '@lib/hooks/useYearnVaults.types';
import type {TVaultsSortBy} from '@lib/utils/types';

type TVaultsListHeadProps = {
	items: {
		label: string;
		isSortable: boolean;
		value: string;
	}[];
	sortBy: TVaultsSortBy;
	sortDirection: TSortDirection;
	onSortBy: (sortBy: TVaultsSortBy) => void;
	onSortDirection: (sortDirection: TSortDirection) => void;
	vaults: TYDaemonVaults;
};

export const VaultsListHead = (props: TVaultsListHeadProps): ReactElement => {
	/**********************************************************************************************
	 ** This toggleSortDirection function changes sort direction between asc, desc and 'no-sort'.
	 *********************************************************************************************/
	const toggleSortDirection = useCallback(
		(newSortBy: TVaultsSortBy): void => {
			props.onSortBy(newSortBy);
			if (props.sortBy === newSortBy) {
				if (props.sortDirection === '') {
					return props.onSortDirection('desc');
				}
				if (props.sortDirection === 'desc') {
					return props.onSortDirection('asc');
				}
				if (props.sortDirection === 'asc') {
					return props.onSortDirection(null);
				}
			}
			return props.onSortDirection('desc');
		},
		[props]
	);
	/**********************************************************************************************
	 ** This renderSortIcons function returns the correct icon, according to current sort state.
	 *********************************************************************************************/
	const renderSortIcons = useCallback(
		(shouldSortBy: boolean): ReactElement => {
			if (shouldSortBy && props.sortDirection === 'desc') {
				return (
					<IconSort
						leftIconColorClassName={'text-regularColor'}
						rightIconColorClassName={'text-regularColor'}
						rightOpacity={'1'}
						className={'size-4'}
					/>
				);
			}
			if (shouldSortBy && props.sortDirection === 'asc') {
				return (
					<IconSort
						leftIconColorClassName={'text-regularColor'}
						rightIconColorClassName={'text-regularColor'}
						leftOpacity={'1'}
						className={'size-4'}
					/>
				);
			}
			return (
				<IconSort
					leftIconColorClassName={'text-regularColor'}
					rightIconColorClassName={'text-regularColor'}
					className={'size-4 opacity-50'}
				/>
			);
		},
		[props.sortDirection]
	);

	return (
		<div className={'hidden px-2 md:col-span-7 md:grid md:grid-cols-7'}>
			{props.items.map(item =>
				item.isSortable ? (
					<button
						onClick={() => toggleSortDirection(item.value as TVaultsSortBy)}
						className={cl(
							'flex w-full items-center gap-x-2',
							item.value === 'deposits' || item.value === 'balance' || item.value === 'apr'
								? 'justify-end'
								: 'justify-center'
						)}
						key={item.label}>
						{renderSortIcons(props.sortBy === item.value)}
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
									? 'justify-center col-span-2 pl-10'
									: 'justify-end'
						)}>
						{item.label}
					</div>
				)
			)}
		</div>
	);
};
