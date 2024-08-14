import PlausibleProvider from 'next-plausible';
import {Meta} from '@lib/components/common/Meta';
import {WithFonts} from '@lib/components/common/WithFonts';

import Layout from '../components/Layout';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';

import '@lib/style.css';

function MyApp(props: AppProps): ReactElement {
	return (
		<WithFonts>
			<PlausibleProvider
				domain={process.env.PLAUSIBLE_DOMAIN || 'yearn.space'}
				pageviewProps={{title: 'Yearn Space'}}
				scriptProps={{
					src: '/js/tellmom.js',
					nonce: 'Yearn Space'
				}}
				enabled={true}>
				<Meta
					title={'Yearn Space'}
					titleColor={'#FFFFFF'}
					themeColor={'#000000'}
					description={
						'The best risk adjusted yields in DeFi, on the best protocols in crypto. Yearn X takes you straight to Yearn Vaults from some of the most popular crypto ecosystems.'
					}
					og={'https://yearn.space/og.png'}
					uri={'https://yearn.space'}
				/>
				<div className={'bg-background flex w-full flex-col justify-center '}>
					<main className={'relative mb-0  flex min-h-screen w-full flex-col pb-8 md:pb-0'}>
						<Layout {...props} />
					</main>
				</div>
			</PlausibleProvider>
		</WithFonts>
	);
}
export default MyApp;
