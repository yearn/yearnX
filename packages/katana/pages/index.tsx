import {type ReactElement, useMemo} from 'react';
import {Footer} from '@lib/components/common/KatanaFooter';
import {KatanaHeader} from '@lib/components/common/KatanaHeader';
import {VaultList} from '@lib/components/common/KatanaVaultList';
import {useFetchYearnVaults} from '@lib/hooks/useYearnVaults';
import {Section} from '@lib/sections';
import {useDeepCompareMemo} from '@react-hookz/web';

import {APY_TYPE, PROJECT_DESCRIPTION, PROJECT_TITLE, VARIANT_TO_USE, VAULT_FILTER} from '../constants';

export default function Index(): ReactElement {
	const {vaults, isLoading} = useFetchYearnVaults(VAULT_FILTER, [1, 747474]);
	const vaultsValues = useDeepCompareMemo(() => Object.values(vaults), [vaults]);

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

	return (
		<section className={'flex w-full max-w-[1200px] flex-col gap-y-6'}>
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
			<VaultList
				vaults={vaultsValues}
				isLoading={isLoading}
				options={{
					apyType: APY_TYPE,
					shouldDisplaySubAPY: APY_TYPE === 'ESTIMATED'
				}}
			/>

			<Footer />
		</section>
	);
}
