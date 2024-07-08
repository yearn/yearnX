import Image from 'next/image';
import {cl} from '@builtbymom/web3/utils';

import type {ReactElement} from 'react';
import type {TSectionProps} from '@lib/utils/types';

export const Section5 = ({bgImage, description}: TSectionProps): ReactElement => {
	return (
		<div className={'h-section min-h-section relative w-full gap-x-6'}>
			<div className={'h-full rounded-2xl'}>
				<Image
					src={bgImage ?? '/bg-placeholder.png'}
					priority
					alt={''}
					width={2400} /* Scaled x2 to keep quality OK */
					height={1056} /* Scaled x2 to keep quality OK */
					style={{objectFit: 'cover', width: '100%', height: '100%'}}
				/>
				<div className={'absolute inset-0 grid grid-cols-12 gap-6 p-10'}>
					<div
						className={cl(
							'col-span-12 md:col-span-5',
							'bg-table flex h-full flex-col justify-between rounded-b-2xl p-10 md:rounded-2xl'
						)}>
						<div className={'leading-4xl md:leading-7xl text-4xl font-black text-white md:text-7xl'}>
							{'YEARN PARTNER VAULTS'}
						</div>
						<div className={'w-full rounded-2xl'}>
							<p className={'text-lg'}>{description}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
