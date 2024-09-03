import {Fragment, type ReactElement} from 'react';
import PlausibleProvider from 'next-plausible';
import {Meta} from '@lib/components/common/Meta';
import WithContexts from '@lib/contexts/WithContexts';

import {COLORS, PROJECT_DESCRIPTION, PROJECT_TITLE} from '../constants';

import type {AppProps} from 'next/app';

import '@lib/style.css';

export default function MyApp(props: AppProps): ReactElement {
	return (
		<Fragment>
			<Meta
				title={PROJECT_TITLE}
				description={PROJECT_DESCRIPTION}
				titleColor={COLORS.background}
				themeColor={COLORS.primary}
				og={''}
				uri={''}
			/>
			<PlausibleProvider
				domain={'yearn.space'}
				pageviewProps={{title: PROJECT_TITLE}}
				scriptProps={{
					src: '/js/tellmom.js',
					nonce: PROJECT_TITLE
				}}
				enabled={true}>
				<WithContexts {...props} />
			</PlausibleProvider>
		</Fragment>
	);
}
