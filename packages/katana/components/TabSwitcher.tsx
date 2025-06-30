import React from 'react';
import {cl} from '@lib/utils';

type TTabOption = {
	id: string | number;
	name: string;
};

type TTabSwitcherProps = {
	selected: string | number;
	onSelect: (id: string | number) => void;
	options: TTabOption[];
};

export function TabSwitcher({selected, onSelect, options}: TTabSwitcherProps): React.ReactElement {
	return (
		<div className={'bg-table mb-4 flex rounded-xl p-0.5'}>
			{options.map(option => (
				<button
					key={option.id}
					onClick={() => onSelect(option.id)}
					className={cl(
						'flex-1 rounded-[10px] px-4 py-2 text-base font-semibold transition-all',
						selected === option.id
							? 'bg-[#F2FC06] text-black'
							: 'bg-transparent text-white/75 hover:text-white'
					)}>
					{option.name}
				</button>
			))}
		</div>
	);
}
