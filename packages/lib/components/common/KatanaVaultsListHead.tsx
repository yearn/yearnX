import {type ReactElement, useCallback} from 'react';
import {cl} from '@lib/utils';

import {IconSort} from '../icons/IconSort';

import type {TYDaemonVaults} from '@lib/hooks/useYearnVaults.types';
import type {TSortDirection} from '@lib/types';
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
					props.onSortBy(null);
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
			const shouldHighlightRight = shouldSortBy && props.sortDirection === 'desc';
			const shouldHighlightLeft = shouldSortBy && props.sortDirection === 'asc';

			return (
				<IconSort
					leftIconColorClassName={shouldHighlightLeft ? 'opacity-1' : 'opacity-50'}
					rightIconColorClassName={shouldHighlightRight ? 'opacity-1' : 'opacity-50'}
					className={'size-4'}
				/>
			);
		},
		[props]
	);

	return (
		<div className={'hidden px-2 md:col-span-7 md:grid md:grid-cols-10'}>
			{props.items.map(item =>
				item.isSortable ? (
					<button
						onClick={() => toggleSortDirection(item.value as TVaultsSortBy)}
						className={cl(
							'flex w-full items-center gap-x-2 group col-span-2',
							item.value === 'balance' || item.value === 'apy'
								? 'justify-end'
								: item.value === 'deposits'
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
								? 'col-span-3 justify-start'
								: item.value === 'manage'
									? 'justify-center col-span-3 pl-20'
									: 'justify-end'
						)}>
						{item.label}
					</div>
				)
			)}
		</div>
	);
};
