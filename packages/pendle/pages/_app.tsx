import {Meta} from '@lib/components/common/Meta';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';

import '@lib/style.css';

export default function MyApp(props: AppProps): ReactElement {
	const {Component} = props;
	return (
		<>
			<Meta
				title={'Yearn x Pendle'}
				description={'Feeling lucky Anon?'}
				titleColor={'#FFFFFF'}
				themeColor={'#4C249F'}
				og={''}
				uri={''}
			/>
			<div className={'bg-background flex w-full justify-center p-6'}>
				<main className={'relative flex  h-[calc(100vh-48px)] w-full justify-center'}>
					<Component />
				</main>
			</div>
		</>
	);
}
