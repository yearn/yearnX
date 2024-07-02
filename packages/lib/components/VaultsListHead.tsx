import {type ReactElement} from 'react';
import {cl} from '@builtbymom/web3/utils';

import {IconSort} from './icons/IconSort';

type TVaultsListHeadProps = {
	items: {
		label: string;
		isSortable: boolean;
		value: string;
	}[];
	sortBy: string;
	sortDirection: string;
};

export const VaultsListHead = (props: TVaultsListHeadProps): ReactElement => {
	return (
		<div className={'hidden px-2 text-neutral-600 md:col-span-7 md:grid md:grid-cols-5'}>
			{props.items.map(item =>
				item.isSortable ? (
					<button
						className={cl(
							'flex items-center gap-x-2 w-full',
							item.value === 'vault' ? 'justify-start' : 'justify-center'
						)}
						key={item.label}>
						<IconSort className={'size-3'} />
						<p className={'text-white'}>{item.label}</p>
					</button>
				) : (
					<div
						key={item.value}
						className={'flex flex-row items-center justify-center text-white'}>
						{item.label}
					</div>
				)
			)}
		</div>
	);
};
