import Image from 'next/image';
import {cl} from '@lib/utils';

import type {ReactElement} from 'react';
import type {TSectionProps} from '@lib/utils/types';

export const KatanaSection = ({bgImage}: TSectionProps): ReactElement => (
	<div
		className={'lg-text:grid lg-text:grid-cols-12 lg-text:gap-6 flex min-h-52 w-full flex-col'}
		style={{alignItems: 'stretch'}}>
		<div
			className={cl(
				'col-span-12 md:col-span-8',
				'w-full overflow-hidden rounded-t-2xl bg-cover bg-center bg-no-repeat md:rounded-2xl'
			)}
			style={{
				display: 'flex',
				flexDirection: 'column',
				minHeight: '64px',
				aspectRatio: '16/9' // Ensures the image maintains its aspect ratio
			}}>
			<Image
				src={bgImage ?? '/bg-placeholder.png'}
				priority
				loading={'eager'}
				alt={''}
				className={'w-full'}
				width={1408} /* Scaled x2 to keep quality OK */
				height={1056} /* Scaled x2 to keep quality OK */
				style={{
					objectFit: 'cover',
					width: '100%',
					height: '100%'
				}}
			/>
		</div>
		<div
			className={cl(
				'col-span-12 md:col-span-4',
				'bg-table flex flex-col justify-between rounded-b-2xl p-6 md:p-10 md:rounded-2xl'
			)}>
			<div className={'w-full rounded-2xl'}>
				<p className={'text-md'}>
					<span style={{color: '#f8fe06'}}>{'Welcome'}</span>
					{' weary DeFi Ronin. You have arrived at the Yearn '}
					<span style={{color: '#549ff0'}}>{'Dojo'}</span>
					{'.'}
				</p>
				<br />
				<p className={'text-md'}>
					{'Here your assets will find rest and reprieve. And a bridge to the Katana Network. '}
				</p>
				<br />
				<p className={'text-md'}>
					{
						'Deposit USDT, USDC, WBTC, and WETH below. When Katana Chain is live, your funds will be automatically bridged to Katana, and you will be the first Samurai to earn your reward! Make sure to deposit here using a wallet with '
					}
					<span className={'group relative'}>
						<span className={'cursor-pointer underline'}>{'an address you can control on a new L2'}</span>
						{/* Tooltip */}
						<span
							className={
								'absolute left-1/2 top-full z-10 hidden w-64 -translate-x-1/2 translate-y-2 rounded-lg bg-black p-2 text-xs text-white shadow-lg group-hover:block'
							}>
							{
								'Smart contract wallets like Gnosis Safe should only be used if you can deploy the same address to an L2 chain. If you are unsure, we recommend using an EOA wallet.'
							}
						</span>
					</span>
					{'.'}
				</p>
				<br />
				<p className={'text-md'}>
					{
						'When the Katana Chain is live, your funds will be automatically bridged to Katana and you will be the first '
					}
					<span style={{color: '#f8fe06'}}>{'Samurai!'}</span>
				</p>
			</div>
		</div>
	</div>
);
