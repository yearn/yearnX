import {type ReactElement} from 'react';
import {DefaultHeader} from '@lib/components/common/DefaultHeader';
import {Footer} from '@lib/components/common/Footer';
import {VaultList} from '@lib/components/common/VaultList';
import {useFetchYearnVaults} from '@lib/hooks/useYearnVaults';
import {Section} from '@lib/sections';
import {useDeepCompareMemo} from '@react-hookz/web';

import {APY_TYPE, VARIANT_TO_USE, VAULT_FILTER} from '../constants';

export default function Index(): ReactElement {
	const {vaults, isLoading} = useFetchYearnVaults(VAULT_FILTER);
	const vaultsValues = useDeepCompareMemo(() => Object.values(vaults), [vaults]);

	return (
		<section className={'flex w-full max-w-[1200px] flex-col gap-y-6'}>
			<DefaultHeader
				docsLink={'https://docs.yearn.fi/'}
				secondLogoURL={'/partnerLogo.svg'}
			/>
			<Section
				variant={VARIANT_TO_USE}
				bgImage={'/bg.png'}
				title={'Ajna Vaults'}
				description={'Get the best risk adjusted Ajna yields, with Yearn.'}
				cards={[
					{title: 'Grand prize', currency: 'ETH', value: 192, decimals: 2, isReady: true},
					{title: 'Grand prize', currency: 'ETH', value: 111, decimals: 2, isReady: true},
					{title: 'Grand prize', currency: 'ETH', value: 1, decimals: 2, isReady: true}
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

			<Footer docsLink={'https://docs.yearn.fi/'} />
		</section>
	);
}
