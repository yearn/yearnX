import {DefaultHeader} from '@lib/components/common/DefaultHeader';
import {Footer} from '@lib/components/common/Footer';
import {ListOfVaults} from '@lib/components/common/ListOfVaults';
import {useFetchYearnVaults} from '@lib/hooks/useYearnVaults';
import {Section} from '@lib/sections';

import {HEADER_TABS, VARIANT_TO_USE, VAULT_FILTER} from '../constants';

import type {ReactElement} from 'react';

export default function Index(): ReactElement {
	const {vaults, isLoading} = useFetchYearnVaults(VAULT_FILTER);

	console.log(vaults, isLoading);
	//[...Object.values(vaults)]
	return (
		<div className={'flex w-full max-w-[1200px] flex-col gap-y-6 pb-6'}>
			<DefaultHeader
				docsLink={''}
				secondLogoURL={''}
			/>
			<Section variant={VARIANT_TO_USE} />
			<ListOfVaults
				vaults={[...Object.values(vaults)]}
				headerTabs={HEADER_TABS}
			/>

			<Footer
				docsLink={''}
				secondLogoURL={''}
			/>
		</div>
	);
}
