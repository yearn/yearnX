import Image from 'next/image';

import type {ReactElement} from 'react';
import type {TSectionProps} from '@lib/utils/types';

export const Section4 = ({bgImage, description}: TSectionProps): ReactElement => {
	return (
		<div className={'h-section min-h-section grid grid-cols-1 md:grid-cols-3 md:gap-6'}>
			<div className={'bg-table flex flex-col justify-between rounded-2xl p-10'}>
				<div className={'leading-4xl md:leading-7xl text-regularText text-4xl font-black md:text-7xl'}>
					{'YEARN PARTNER VAULTS'}
				</div>
				<p>{description}</p>
			</div>

			<div className={'bg-table flex items-end justify-start rounded-2xl p-10'}>
				<div>
					<p>{'Several lines description.'}</p>
					<p className={'leading-7xl text-7xl font-black'}>{'192%'}</p>
				</div>
			</div>

			<div className={'overflow-hidden rounded-2xl bg-cover bg-center bg-no-repeat md:mb-0'}>
				<Image
					className={'size-full md:w-0'}
					src={bgImage ?? '/bg-placeholder.png'}
					priority
					alt={''}
					width={768} /* Scaled x2 to keep quality OK */
					height={1056} /* Scaled x2 to keep quality OK */
					style={{objectFit: 'cover', width: '100%', height: '100%'}}
				/>
			</div>
		</div>
	);
};
