import Image from 'next/image';
import {cl} from '@builtbymom/web3/utils';

import type {ReactElement} from 'react';
import type {TSectionProps} from '@lib/utils/types';

export const Section2 = ({bgImage}: TSectionProps): ReactElement => {
	return (
		<div className={'h-section min-h-section flex w-full grid-cols-12 flex-col-reverse md:grid md:gap-6'}>
			<div
				className={cl(
					'col-span-12 md:col-span-5',
					'bg-table flex flex-col justify-between rounded-b-2xl p-10 md:rounded-2xl'
				)}>
				<div className={'leading-4xl md:leading-7xl text-4xl font-black text-white md:text-7xl'}>
					{'YEARN PARTNER VAULTS'}
				</div>
				<div className={'bg-primary text-accentText w-full rounded-2xl p-6'}>
					<b className={'block'}>{'GRAND PRIZE'}</b>
					<div className={'flex items-end'}>
						<p className={'leading-4xl md:leading-7xl font-mono text-4xl font-black md:text-7xl'}>
							{'123.69'}
							<span className={'pl-2 font-mono text-xl font-bold'}>{'ETH'}</span>
						</p>
					</div>
				</div>
			</div>
			<div className={cl('col-span-12 md:col-span-7', 'size-full overflow-hidden rounded-t-2xl md:rounded-2xl')}>
				<Image
					src={bgImage ?? '/bg-placeholder.png'}
					priority
					alt={''}
					width={1408} /* Scaled x2 to keep quality OK */
					height={1056} /* Scaled x2 to keep quality OK */
					style={{objectFit: 'cover', width: '100%', height: '100%'}}
				/>
			</div>
		</div>
	);
};
