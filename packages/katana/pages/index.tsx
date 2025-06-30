import {type ReactElement, useMemo, useState} from 'react';
import {Footer} from '@lib/components/common/KatanaFooter';
import {KatanaHeader} from '@lib/components/common/KatanaHeader';
import {VaultList} from '@lib/components/common/KatanaVaultList';
import {useFetchYearnVaults} from '@lib/hooks/useYearnVaults';
import {Section} from '@lib/sections';
import {useDeepCompareMemo} from '@react-hookz/web';

import {TabSwitcher} from '../components/TabSwitcher';
import {APY_TYPE, PROJECT_DESCRIPTION, PROJECT_TITLE, VARIANT_TO_USE, VAULT_FILTER} from '../constants';

export default function Index(): ReactElement {
	const [selectedTab, set_selectedTab] = useState<string | number>('all');
	const {vaults, isLoading} = useFetchYearnVaults(VAULT_FILTER, [1, 747474]);
	const allVaultsValues = useDeepCompareMemo(() => Object.values(vaults), [vaults]);

	// Filter vaults by selected tab
	const vaultsValues = useMemo(() => {
		if (selectedTab === 'all') {
			return allVaultsValues;
		}
		return allVaultsValues.filter(vault => vault.chainID === selectedTab);
	}, [allVaultsValues, selectedTab]);

	const sumOfTVL = useMemo(() => {
		if (vaultsValues.length === 0) {
			return 0;
		}
		return vaultsValues.reduce((acc, vault) => acc + vault.tvl.tvl, 0);
	}, [vaultsValues]);

	const upToAPY = useMemo(() => {
		if (vaultsValues.length === 0) {
			return 0;
		}
		const apys = vaultsValues.map(
			vault => (APY_TYPE === 'ESTIMATED' ? vault.apr.forwardAPR.netAPR : vault.apr.netAPR) * 100
		);
		if (apys.length > 0) {
			return Math.max(...apys);
		}
		return Math.max(...apys);
	}, [vaultsValues]);

	const upToBoost = useMemo(() => {
		if (vaultsValues.length === 0) {
			return 0;
		}
		const boost = vaultsValues.map(vault => vault.apr.forwardAPR.composite.boost);
		return Math.max(...boost);
	}, [vaultsValues]);

	const tabOptions = useMemo(
		() => [
			{id: 'all', name: 'All Vaults'},
			{id: 747474, name: 'Katana'},
			{id: 1, name: 'Ethereum'}
		],
		[]
	);

	return (
		<section className={'flex w-full max-w-screen-xl flex-col gap-y-6'}>
			<KatanaHeader secondLogoURL={'/katanaTypemark.png'} />
			<Section
				variant={VARIANT_TO_USE}
				bgImage={'/bg3.png'}
				title={PROJECT_TITLE}
				description={PROJECT_DESCRIPTION}
				cards={[
					{title: 'TVL', currency: 'USD', value: sumOfTVL, decimals: 0, isReady: sumOfTVL > 0},
					{title: 'APY up to', currency: '%', value: upToAPY, decimals: 2, isReady: upToAPY > 0},
					{title: 'Boost up to', currency: 'x', value: upToBoost, decimals: 2, isReady: upToAPY > 0}
				]}
			/>
			<div className={'flex flex-col gap-y-0'}>
				<TabSwitcher
					selected={selectedTab}
					onSelect={set_selectedTab}
					options={tabOptions}
				/>
				<VaultList
					vaults={vaultsValues}
					isLoading={isLoading}
					options={{
						apyType: APY_TYPE,
						shouldDisplaySubAPY: APY_TYPE === 'ESTIMATED'
					}}
				/>
			</div>
			<Footer />
		</section>
	);
}
