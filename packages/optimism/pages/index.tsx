import {type ReactElement} from 'react';
import {DefaultHeader} from '@lib/components/common/DefaultHeader';
import {Footer} from '@lib/components/common/Footer';
import {VaultList} from '@lib/components/common/VaultList';
import {useFetchYearnVaults} from '@lib/hooks/useYearnVaults';
import {useDeepCompareMemo} from '@react-hookz/web';

import {HEADER_TABS, VAULT_FILTER} from '../constants';

export default function Index(): ReactElement {
	const {vaults, isLoading} = useFetchYearnVaults(VAULT_FILTER);
	const vaultsValues = useDeepCompareMemo(() => Object.values(vaults), [vaults]);

	return (
		<section className={'flex w-full max-w-[1200px] flex-col gap-y-6'}>
			<DefaultHeader
				docsLink={''}
				secondLogoURL={'/partnerLogo.svg'}
			/>
			{/* <Section
				variant={VARIANT_TO_USE}
				bgImage={'/bg.webp'}
				title={'YEARN PARTNER VAULTS'}
				description={
					'Several lines description. Several lines description. Several lines description. Several lines description. '
				}
			/> */}
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
