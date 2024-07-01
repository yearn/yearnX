import {DefaultHeader} from '@lib/components/common/DefaultHeader';
import {Section} from '@lib/sections';

import type {ReactElement} from 'react';

export default function Index(): ReactElement {
	return (
		<div className={'flex w-full max-w-[1200px] flex-col gap-y-6'}>
			<DefaultHeader
				docsLink={''}
				firstLogoURL={''}
				secondLogoURL={''}
			/>
			<Section variant={1} />
		</div>
	);
}
