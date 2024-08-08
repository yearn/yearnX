import {Toaster} from 'react-hot-toast';
import PlausibleProvider from 'next-plausible';
import {optimism} from 'viem/chains';
import {WalletContextApp} from '@builtbymom/web3/contexts/useWallet';
import {WithMom} from '@builtbymom/web3/contexts/WithMom';
import {SafeProvider} from '@gnosis.pm/safe-apps-react-sdk';
import {Meta} from '@lib/components/common/Meta';
import {WithFonts} from '@lib/components/common/WithFonts';
import {IconCheck} from '@lib/components/icons/IconCheck';
import {IconCircleCross} from '@lib/components/icons/IconCircleCross';
import {VaultsContextApp} from '@lib/contexts/useManageVaults';
import {WithPopularTokens} from '@lib/contexts/usePopularTokens';
import {WithPrices} from '@lib/contexts/usePrices';
import {SolverContextApp} from '@lib/contexts/useSolver';
import {supportedNetworks} from '@lib/utils/tools.chains';

import {COLORS, PROJECT_DESCRIPTION, PROJECT_TITLE} from '../constants';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';

import '@lib/style.css';

export default function MyApp(props: AppProps): ReactElement {
	const {Component} = props;
	return (
		<WithFonts>
			<PlausibleProvider
				domain={process.env.PLAUSIBLE_DOMAIN || 'yearn.space'}
				pageviewProps={{title: PROJECT_TITLE}}
				scriptProps={{
					src: '/js/tellmom.js',
					nonce: PROJECT_TITLE
				}}
				enabled={true}>
				<Meta
					title={PROJECT_TITLE}
					description={PROJECT_DESCRIPTION}
					titleColor={COLORS.background}
					themeColor={COLORS.primary}
					og={'https://pooltogether.yearn.space/og.png'}
					uri={'https://pooltogether.yearn.space'}
				/>
				<WithMom
					supportedChains={supportedNetworks}
					defaultNetwork={optimism}
					tokenLists={['https://raw.githubusercontent.com/SmolDapp/tokenLists/main/lists/yearn-min.json']}>
					<WalletContextApp>
						<WithPopularTokens>
							<WithPrices supportedNetworks={supportedNetworks}>
								<SafeProvider>
									<VaultsContextApp>
										<SolverContextApp>
											<div
												className={
													'bg-background flex h-lvh w-full justify-center overflow-auto p-6'
												}>
												<main className={'relative mb-auto flex w-full justify-center'}>
													<Component />
												</main>
											</div>
										</SolverContextApp>
									</VaultsContextApp>
								</SafeProvider>
							</WithPrices>
						</WithPopularTokens>
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
			</PlausibleProvider>
		</WithFonts>
	);
}
