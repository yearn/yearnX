import React from 'react';
import {Toaster} from 'react-hot-toast';
import localFont from 'next/font/local';
import {base, mainnet, optimism, polygon} from 'viem/chains';
import {WalletContextApp} from '@builtbymom/web3/contexts/useWallet';
import {WithMom} from '@builtbymom/web3/contexts/WithMom';
import {localhost} from '@builtbymom/web3/utils/wagmi';
import {Confettis} from '@icons/Confettis';
import {IconCheck} from '@icons/IconCheck';
import {IconCircleCross} from '@icons/IconCircleCross';
import {Header} from '@common/Header';
import Meta from '@common/Meta';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';

import '../style.css';

const aeonik = localFont({
	variable: '--font-aeonik',
	display: 'swap',
	src: [
		{
			path: '../public/fonts/Aeonik-Regular.woff2',
			weight: '400',
			style: 'normal'
		},
		{
			path: '../public/fonts/Aeonik-Bold.woff2',
			weight: '700',
			style: 'normal'
		},
		{
			path: '../public/fonts/Aeonik-Black.ttf',
			weight: '900',
			style: 'normal'
		}
	]
});

function MyApp({Component, ...props}: AppProps): ReactElement {
	return (
		<div
			className={aeonik.className}
			style={aeonik.style}>
			<Meta />
			<WithMom
				supportedChains={[mainnet, polygon, optimism, base, localhost]}
				tokenLists={['https://raw.githubusercontent.com/SmolDapp/tokenLists/main/lists/tokenlistooor.json']}>
				<WalletContextApp>
					<div
						className={`${aeonik.variable} relative`}
						style={aeonik.style}>
						<div className={'absolute inset-x-0 top-0 pt-0 opacity-60'}>
							<Confettis />
						</div>
						<Header />
						<main className={`relative mx-auto mb-0 flex min-h-screen w-full flex-col ${aeonik.variable}`}>
							<div className={'mx-auto -mt-6 w-fit rounded-[40px] bg-[#6303FF] px-7 py-4 text-center'}>
								<p className={'text-2xl font-bold uppercase text-white'}>{'Feeling Lucky Anon?'}</p>
							</div>

							<div className={'my-6 text-center drop-shadow-2xl'}>
								<h1 className={'py-4 text-9xl uppercase text-white'}>{'Prize Vaults'}</h1>
								<p className={'text-lg uppercase text-white/95'}>
									{'Earn yield with the chance to win the GRAND PRIZE!'}
								</p>
							</div>
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
		</div>
	);
}
export default MyApp;
