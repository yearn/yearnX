import {DefaultHeader} from '@lib/components/common/DefaultHeader';
import {useFetchYearnVaults} from '@lib/hooks/useYearnVaults';
import {Section} from '@lib/sections';

import {VARIANT_TO_USE, VAULT_FILTER} from '../constants';

import type {ReactElement} from 'react';

export default function Index(): ReactElement {
	const {vaults, isLoading} = useFetchYearnVaults(VAULT_FILTER);

	console.log(vaults, isLoading);

	return (
		<div className={'flex w-full max-w-[1200px] flex-col gap-y-6'}>
			<DefaultHeader
				docsLink={''}
				firstLogoURL={''}
				secondLogoURL={''}
			/>
			<Section variant={VARIANT_TO_USE} />
		</div>
	);
}
