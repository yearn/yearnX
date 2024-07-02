import {Meta} from '@lib/components/common/Meta';
import {WithFonts} from '@lib/components/common/WithFonts';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';

import '@lib/style.css';

export default function MyApp(props: AppProps): ReactElement {
	const {Component} = props;
	return (
		<WithFonts>
			<Meta
				title={'Yearn x Pendle'}
				description={'Feeling lucky Anon?'}
				titleColor={'#FFFFFF'}
				themeColor={'#4C249F'}
				og={''}
				uri={''}
			/>
			<div className={'bg-background flex h-lvh w-full justify-center overflow-auto p-6'}>
				<main className={'relative flex  w-full justify-center'}>
					<Component />
				</main>
			</div>
		</WithFonts>
	);
}
