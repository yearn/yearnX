import {type ReactElement} from 'react';
import {DefaultHeader} from '@lib/components/common/DefaultHeader';
import {Footer} from '@lib/components/common/Footer';
import {VaultList} from '@lib/components/common/VaultList';
import {useFetchYearnVaults} from '@lib/hooks/useYearnVaults';
import {Section} from '@lib/sections';
import {useDeepCompareMemo} from '@react-hookz/web';

import {HEADER_TABS, VARIANT_TO_USE, VAULT_FILTER} from '../constants';

import type {GetServerSideProps} from 'next';

export default function Index(): ReactElement {
	const {vaults, isLoading} = useFetchYearnVaults(VAULT_FILTER);
	const vaultsValues = useDeepCompareMemo(() => Object.values(vaults), [vaults]);

	return (
		<section className={'flex w-full max-w-[1200px] flex-col gap-y-6'}>
			<DefaultHeader
				docsLink={''}
				secondLogoURL={'/partnerLogo.svg'}
			/>
			<Section
				variant={VARIANT_TO_USE}
				bgImage={'/bg.webp'}
				title={'YEARN PARTNER VAULTS'}
				description={
					'Several lines description. Several lines description. Several lines description. Several lines description. '
				}
				cards={[
					{title: 'Grand prize', currency: 'ETH', value: 192, decimals: 2, isReady: true},
					{title: 'Grand prize', currency: 'ETH', value: 111, decimals: 2, isReady: true},
					{title: 'Grand prize', currency: 'ETH', value: 1, decimals: 2, isReady: true}
				]}
			/>
			<VaultList
				vaults={vaultsValues}
				isLoading={isLoading}
				headerTabs={HEADER_TABS}
			/>

			<Footer
				docsLink={''}
				secondLogoURL={''}
			/>
		</section>
	);
}

// Using the getServerSideProps to make sure that the search params are available on the client from the first render
export const getServerSideProps = (async () => ({props: {}})) satisfies GetServerSideProps;
