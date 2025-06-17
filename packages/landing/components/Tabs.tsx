import {cl} from '@lib/utils';

import type {ReactElement} from 'react';
import type {TTab} from '../types';

type TTabsProps = {
	tabs: TTab[];
	selectedTab: TTab;
	set_selectedTab: (value: TTab) => void;
};

export function Tabs(props: TTabsProps): ReactElement {
	const {tabs, selectedTab, set_selectedTab} = props;
	return (
		<div className={'flex flex-wrap gap-2'}>
			{tabs.map(tab => (
				<button
					onClick={() => set_selectedTab(tab)}
					className={cl(
						'text-regularText rounded-[80px] px-6 py-3 text-base font-normal border',
						selectedTab.value === tab.value ? 'border-regularText' : 'border-regularText/15'
					)}
					key={tab.value}>
					{tab.label}
				</button>
			))}
		</div>
	);
}
