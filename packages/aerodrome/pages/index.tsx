import {type ReactElement, useMemo} from 'react';
import {DefaultHeader} from '@lib/components/common/DefaultHeader';
import {Footer} from '@lib/components/common/Footer';
import {VaultList} from '@lib/components/common/VaultList';
import {useFetchYearnVaults} from '@lib/hooks/useYearnVaults';
import {Section} from '@lib/sections';
import {useDeepCompareMemo} from '@react-hookz/web';

import {APR_TYPE, VARIANT_TO_USE, VAULT_FILTER} from '../constants';

export default function Index(): ReactElement {
	const {vaults, isLoading} = useFetchYearnVaults(VAULT_FILTER);
	const vaultsValues = useDeepCompareMemo(() => Object.values(vaults), [vaults]);

	const numberOfVaults = useMemo(() => vaultsValues.length, [vaultsValues]);

	const sumOfTVL = useMemo(() => vaultsValues.reduce((acc, vault) => acc + vault.tvl.tvl, 0), [vaultsValues]);

	const upToAPR = useMemo(() => {
		const aprs = vaultsValues.map(
			vault => (APR_TYPE === 'ESTIMATED' ? vault.apr.forwardAPR.netAPR : vault.apr.netAPR) * 100
		);
		if (aprs.length > 0) {
			return Math.max(...aprs);
		}
		return 0;
	}, [vaultsValues]);

	return (
		<section className={'flex w-full max-w-[1200px] flex-col gap-y-6'}>
			<DefaultHeader
				docsLink={''}
				secondLogoURL={'/partnerLogo.svg'}
			/>
			<Section
				variant={VARIANT_TO_USE}
				bgImage={'/bg.png'}
				title={'Aerodrome Vaults'}
				description={'Get the best risk adjusted Aerodrome yields, with Yearn.'}
				cards={[
					{title: 'TVL', currency: 'USD', value: sumOfTVL, decimals: 0, isReady: sumOfTVL > 0},
					{title: 'APR up to', currency: '%', value: upToAPR, decimals: 2, isReady: upToAPR > 0},
					{title: 'Vaults', value: numberOfVaults, decimals: 0, isReady: numberOfVaults > 0}
				]}
			/>
			<VaultList
				vaults={vaultsValues}
				isLoading={isLoading}
				options={{
					aprType: APR_TYPE
				}}
			/>

			<Footer
				docsLink={''}
				secondLogoURL={''}
			/>
		</section>
	);
}
