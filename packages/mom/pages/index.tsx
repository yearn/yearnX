import {type ReactElement, useMemo} from 'react';
import {DefaultHeader} from '@lib/components/common/DefaultHeader';
import {Footer} from '@lib/components/common/Footer';
import {VaultList} from '@lib/components/common/VaultList';
import {useFetchYearnVaults} from '@lib/hooks/useYearnVaults';
import {Section} from '@lib/sections';
import {useDeepCompareMemo} from '@react-hookz/web';

import {APY_TYPE, VARIANT_TO_USE, VAULT_FILTER} from '../constants';

import type {GetServerSideProps} from 'next';

export default function Index(): ReactElement {
	const {vaults, isLoading} = useFetchYearnVaults(VAULT_FILTER);
	const vaultsValues = useDeepCompareMemo(() => Object.values(vaults), [vaults]);

	const upToAPY = useMemo(() => {
		const apys = vaultsValues.map(
			vault => (APY_TYPE === 'ESTIMATED' ? vault.apr.forwardAPR.netAPR : vault.apr.netAPR) * 100
		);
		if (apys.length > 0) {
			return Math.max(...apys);
		}
		return 0;
	}, [vaultsValues]);

	return (
		<section className={'flex w-full max-w-[1200px] flex-col gap-y-6'}>
			<DefaultHeader
				docsLink={'https://docs.yearn.fi/'}
				secondLogoURL={'/partnerLogo.png'}
			/>
			<Section
				variant={VARIANT_TO_USE}
				bgImage={'/bg.png'}
				title={'MOM TESTING SPACE'}
				description={'Because MOM needs to test thing so you can enjoy and relax. Avoid doing stuff here.'}
				cards={[{title: 'GM Ratio', currency: '%', value: upToAPY, decimals: 2, isReady: upToAPY > 0}]}
			/>
			<VaultList
				vaults={vaultsValues}
				isLoading={isLoading}
				options={{
					apyType: APY_TYPE
				}}
			/>

			<Footer docsLink={'https://docs.yearn.fi/'} />
		</section>
	);
}

// Using the getServerSideProps to make sure that the search params are available on the client from the first render
export const getServerSideProps = (async () => ({props: {}})) satisfies GetServerSideProps;
