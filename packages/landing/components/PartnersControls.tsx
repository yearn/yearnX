import {type ReactElement} from 'react';

import {TABS} from '../constants';
import {SearchBar} from './SearchBar';
import {Tabs} from './Tabs';

import type {TTab} from '../types';

type TPartnersControlsProps = {
	selectedTab: TTab;
	set_selectedTab: (value: TTab) => void;
	searchValue: string;
	set_searchValue: (value: string) => void;
};

export function PartersControls({
	selectedTab,
	set_selectedTab,
	searchValue,
	set_searchValue
}: TPartnersControlsProps): ReactElement {
	return (
		<div className={'flex w-full items-center justify-between'}>
			<div className={'flex items-center gap-x-8'}>
				<span className={'text-regularText text-2xl font-normal'}>{'Partners'}</span>
				<Tabs
					tabs={TABS}
					selectedTab={selectedTab}
					set_selectedTab={set_selectedTab}
				/>
			</div>
			<SearchBar
				searchValue={searchValue}
				set_searchValue={set_searchValue}
			/>
		</div>
	);
}
