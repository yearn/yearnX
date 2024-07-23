import {type ReactElement, useMemo, useState} from 'react';
import {useMountEffect} from '@react-hookz/web';

import {PartersControls} from '../components/PartnersControls';
import {PartnersList} from '../components/PartnersList';
import {PARTNERS} from '../constants';

import type {TPartners, TTab} from '../types';

export default function Index(): ReactElement {
	const [selectedTab, set_selectedTab] = useState<TTab>({label: 'All', value: 'all'});
	const [searchValue, set_searchValue] = useState('');
	const [shuffledPartners, set_shuffledPartners] = useState<TPartners>([]);

	/**********************************************************************************************
	 ** On component mount we shuffle the array of Partners to avoid a certain order.
	 **********************************************************************************************/
	useMountEffect(() => {
		if (PARTNERS.length < 1) {
			return;
		}
		set_shuffledPartners(PARTNERS.sort(() => 0.5 - Math.random()));
	});

	/**********************************************************************************************
	 ** Here we filter partners by selected tab of vault version.
	 *********************************************************************************************/
	const tabFilteredPartners = useMemo(() => {
		if (selectedTab.value === 'all') {
			return [...shuffledPartners];
		}
		const filteredPartners = [...shuffledPartners];
		return filteredPartners.filter(partner => {
			return partner.vaultType === selectedTab.value;
		});
	}, [selectedTab.value, shuffledPartners]);

	/**********************************************************************************************
	 ** Here we filter tab by the vaule in the search bar.
	 *********************************************************************************************/
	const searchFilteredValues = useMemo(() => {
		return [...tabFilteredPartners].filter(partner =>
			partner.name.toLowerCase().includes(searchValue.toLowerCase())
		);
	}, [searchValue, tabFilteredPartners]);

	return (
		<div className={'flex w-full max-w-6xl flex-col gap-y-10 !px-0'}>
			<PartersControls
				selectedTab={selectedTab}
				set_selectedTab={set_selectedTab}
				searchValue={searchValue}
				set_searchValue={set_searchValue}
			/>
			<PartnersList
				partners={searchFilteredValues}
				searchValue={searchValue}
			/>
		</div>
	);
}
