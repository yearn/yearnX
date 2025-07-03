import {Toaster} from 'react-hot-toast';
import {WithFonts} from '@lib/components/common/WithFonts';
import {IconCheck} from '@lib/components/icons/IconCheck';
import {IconCircleCross} from '@lib/components/icons/IconCircleCross';
import {VaultsContextApp} from '@lib/contexts/useManageVaults';
import {SolverContextApp} from '@lib/contexts/useSolver';
import {WithMom} from '@lib/contexts/WithMom';
import {supportedNetworks} from '@lib/utils/tools.chains';

import {WithPopularTokens} from './usePopularTokens';
import {WithPrices} from './usePrices';
import {WalletContextApp} from './useWallet';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';


export default function WithContexts(props: AppProps & {chainIds?: number[]}): ReactElement {
	const {Component} = props;
	return (
		<WithFonts>
			<WithMom
				supportedChains={supportedNetworks}
				tokenLists={['https://raw.githubusercontent.com/SmolDapp/tokenLists/main/lists/yearn-min.json']}>
				<WalletContextApp chainIds={props.chainIds}>
					<WithPopularTokens>
						<WithPrices supportedNetworks={supportedNetworks}>
							<VaultsContextApp>
								<SolverContextApp>
									<div className={'bg-background flex h-lvh w-full justify-center overflow-auto p-6'}>
										<main className={'relative mb-auto flex w-full justify-center'}>
											<Component />
										</main>
									</div>
								</SolverContextApp>
							</VaultsContextApp>
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
		</WithFonts>
	);
}
