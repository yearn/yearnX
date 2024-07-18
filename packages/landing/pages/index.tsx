import {type ReactElement, useMemo, useState} from 'react';

import {PartersControls} from '../components/PartnersControls';
import {PartnersList} from '../components/PartnersList';
import {PARTNERS} from '../constants';

import type {TTab} from '../types';

export default function Index(): ReactElement {
	const [selectedTab, set_selectedTab] = useState<TTab>({label: 'All', value: 'all'});
	const [searchValue, set_searchValue] = useState('');

	const tabFilteredPartners = useMemo(() => {
		if (selectedTab.value === 'all') {
			return [...PARTNERS];
		}
		const filteredPartners = [...PARTNERS];
		return filteredPartners.filter(partner => {
			return partner.vaultType === selectedTab.value;
		});
	}, [selectedTab.value]);

	// const searchFilteredValues = useMemo(() => {
	// 	return [...tabFilteredPartners].filter(partner =>
	// 		partner.name.toLowerCase().includes(searchValue.toLowerCase())
	// 	);
	// }, [searchValue, tabFilteredPartners]);

	return (
		<div className={'container flex w-full flex-col gap-y-10'}>
			<PartersControls
				selectedTab={selectedTab}
				set_selectedTab={set_selectedTab}
				searchValue={searchValue}
				set_searchValue={set_searchValue}
			/>
			<PartnersList
				partners={tabFilteredPartners}
				searchValue={searchValue}
			/>
		</div>
	);
}
