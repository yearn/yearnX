import React from 'react';
import {Toaster} from 'react-hot-toast';
import {base, mainnet, optimism, polygon} from 'viem/chains';
import {WalletContextApp} from '@builtbymom/web3/contexts/useWallet';
import {WithMom} from '@builtbymom/web3/contexts/WithMom';
import {localhost} from '@builtbymom/web3/utils/wagmi';
import {Confettis} from '@icons/Confettis';
import {IconCheck} from '@icons/IconCheck';
import {IconCircleCross} from '@icons/IconCircleCross';
import {Meta} from '@lib/components/common/Meta';
import {WithFonts} from '@lib/components/common/WithFonts';
import {Header} from '@common/Header';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';

import '@lib/style.css';

function MyApp({Component, ...props}: AppProps): ReactElement {
	return (
		<WithFonts>
			<Meta
				title={'Yearn x PoolTogether'}
				description={'Feeling lucky Anon?'}
				titleColor={'#FFFFFF'}
				themeColor={'#4C249F'}
				og={'https://prizes.yearn.fi/og.png'}
				uri={'https://prizes.yearn.fi'}
			/>
			<WithMom
				supportedChains={[mainnet, polygon, optimism, base, localhost]}
				tokenLists={['https://raw.githubusercontent.com/SmolDapp/tokenLists/main/lists/tokenlistooor.json']}>
				<WalletContextApp>
					<div className={'relative'}>
						<div className={'absolute inset-x-0 top-0 pt-0 opacity-60'}>
							<Confettis />
						</div>
						<Header />
						<main className={'relative mx-auto mb-0 flex min-h-screen w-full flex-col'}>
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
		</WithFonts>
	);
}
export default MyApp;
