import React from 'react';
import {Toaster} from 'react-hot-toast';
import {Roboto} from 'next/font/google';
import Head from 'next/head';
import {base, optimism, polygon} from 'viem/chains';
import {WalletContextApp} from '@builtbymom/web3/contexts/useWallet';
import {WithMom} from '@builtbymom/web3/contexts/WithMom';
import {localhost} from '@builtbymom/web3/utils/wagmi';
import {IconCheck} from '@icons/IconCheck';
import {IconCircleCross} from '@icons/IconCircleCross';
import {Header} from '@common/Header';
import Meta from '@common/Meta';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';

import '../style.css';

const roboto = Roboto({
	weight: ['400', '500', '700', '900'],
	subsets: ['latin'],
	display: 'swap',
	variable: '--roboto-font'
});

function MyApp({Component, ...props}: AppProps): ReactElement {
	return (
		<>
			<Head>
				<style
					jsx
					global>
					{`
						html {
							font-family: ${roboto.className};
						}
					`}
				</style>
			</Head>
			<Meta />
			<WithMom
				supportedChains={[polygon, optimism, base, localhost]}
				tokenLists={['https://raw.githubusercontent.com/SmolDapp/tokenLists/main/lists/tokenlistooor.json']}>
				<WalletContextApp>
					<div className={`${roboto.variable}`}>
						<Header />
						<main className={`relative mx-auto mb-0 flex min-h-screen w-full flex-col ${roboto.variable}`}>
							<Component {...props} />
						</main>
					</div>
				</WalletContextApp>
			</WithMom>
			<Toaster
				toastOptions={{
					duration: 5000,
					className: 'toast',
					success: {
						icon: <IconCheck className={'-mr-1 size-5 min-h-5 min-w-5 pt-1.5'} />,
						iconTheme: {
							primary: 'black',
							secondary: '#F1EBD9'
						}
					},
					error: {
						icon: <IconCircleCross className={'-mr-1 size-5 min-h-5 min-w-5 pt-1.5'} />,
						iconTheme: {
							primary: 'black',
							secondary: '#F1EBD9'
						}
					}
				}}
				position={'top-right'}
			/>
		</>
	);
}
export default MyApp;
