import Image from 'next/image';
import {cl} from '@builtbymom/web3/utils';

import type {ReactElement} from 'react';
import type {TSectionProps} from '@lib/utils/types';

export const Section3 = ({description, bgImage}: TSectionProps): ReactElement => {
	return (
		<div className={'grid gap-6'}>
			<div className={'h-section min-h-section flex w-full grid-cols-12 flex-col-reverse md:grid md:gap-6'}>
				<div
					className={cl(
						'col-span-12 md:col-span-5',
						'bg-table flex flex-col justify-between rounded-b-2xl p-10 md:rounded-2xl'
					)}>
					<div className={'leading-4xl md:leading-7xl text-4xl font-black text-white md:text-7xl'}>
						{'YEARN PARTNER VAULTS'}
					</div>
					<div className={'w-full rounded-2xl'}>
						<p className={'text-lg'}>{description}</p>
					</div>
				</div>
				<div
					className={cl(
						'col-span-12 md:col-span-7',
						'w-full overflow-hidden rounded-t-2xl bg-cover bg-center bg-no-repeat md:rounded-2xl'
					)}>
					<Image
						src={bgImage ?? '/bg-placeholder.png'}
						priority
						alt={''}
						className={'w-full'}
						width={1408} /* Scaled x2 to keep quality OK */
						height={1056} /* Scaled x2 to keep quality OK */
						style={{objectFit: 'cover', width: '100%', height: '100%'}}
					/>
				</div>
			</div>

			<div
				className={
					'bg-primary text-accentText grid w-full grid-cols-1 gap-y-6 rounded-2xl px-10 py-16 md:grid-cols-3 md:gap-x-6'
				}>
				<div className={'flex flex-col'}>
					<b className={'block md:mb-4'}>{'GRAND PRIZE'}</b>
					<b className={'font-mono text-3xl md:text-7xl'}>{'123.69'}</b>
				</div>
				<div className={'flex flex-col'}>
					<b className={'block md:mb-4'}>{'GRAND PRIZE'}</b>
					<b className={'font-mono text-3xl md:text-7xl'}>{'123.69'}</b>
				</div>
				<div className={'flex flex-col'}>
					<b className={'block md:mb-4'}>{'GRAND PRIZE'}</b>
					<b className={'font-mono text-3xl md:text-7xl'}>{'123.69'}</b>
				</div>
			</div>
		</div>
	);
};
