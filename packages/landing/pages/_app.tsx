import {Meta} from '@lib/components/common/Meta';
import {WithFonts} from '@lib/components/common/WithFonts';

import Layout from '../components/Layout';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';

import '@lib/style.css';

function MyApp(props: AppProps): ReactElement {
	return (
		<WithFonts>
			<Meta
				title={'Yearn Space'}
				titleColor={'#FFFFFF'}
				themeColor={'#000000'}
				description={
					'Ape Stronger Together. Yearn partners with the best in the industry to bring you the best yield farming strategies.'
				}
				og={'https://yearn.space/og.png'}
				uri={'https://yearn.space'}
			/>
			<div className={'bg-background flex w-full flex-col justify-center '}>
				<main className={'relative mb-0  flex min-h-screen w-full flex-col pb-8 md:pb-0'}>
					<Layout {...props} />
				</main>
			</div>
		</WithFonts>
	);
}
export default MyApp;
