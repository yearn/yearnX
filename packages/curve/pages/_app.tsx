import {Fragment, type ReactElement} from 'react';
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
				og={'https://curve.yearn.space/og.png'}
				uri={'https://curve.yearn.space'}
			/>
			<WithContexts {...props} />
		</Fragment>
	);
}
