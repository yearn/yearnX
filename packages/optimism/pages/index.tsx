import {type ReactElement} from 'react';
import {DefaultHeader} from '@lib/components/common/DefaultHeader';
import {Footer} from '@lib/components/common/Footer';
import {ListOfVaults} from '@lib/components/common/ListOfVaults';
import {useFetchYearnVaults} from '@lib/hooks/useYearnVaults';
import {Section} from '@lib/sections';
import {useDeepCompareMemo} from '@react-hookz/web';

import {HEADER_TABS, VARIANT_TO_USE, VAULT_FILTER} from '../constants';

export default function Index(): ReactElement {
	const {vaults, isLoading} = useFetchYearnVaults(VAULT_FILTER);
	const vaultsValues = useDeepCompareMemo(() => Object.values(vaults), [vaults]);

	return (
		<section className={'flex w-full max-w-[1200px] flex-col gap-y-6 pb-6'}>
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
			/>
			<ListOfVaults
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
