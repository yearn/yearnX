import Image from 'next/image';

import type {ReactElement} from 'react';
import type {TSectionProps} from '@lib/utils/types';

export const Section4 = ({bgImage, title, description}: TSectionProps): ReactElement => {
	return (
		<div className={'md:h-section min-h-section flex flex-col-reverse gap-2 md:grid md:grid-cols-3 md:gap-6'}>
			<div className={'bg-table flex items-end justify-start rounded-2xl p-6 md:hidden'}>
				<div>
					<p>{'Several lines description.'}</p>
					<p className={'text-4xl font-bold leading-[48px]'}>{'192%'}</p>
				</div>
			</div>
			<div className={'bg-table flex flex-col justify-between rounded-2xl p-6 lg:p-10'}>
				<div className={'lg:leading-7xl text-regularText text-4xl font-black leading-[48px] lg:text-7xl'}>
					{title}
				</div>
				<p className={'text-lg'}>{description}</p>
			</div>

			<div className={'bg-table hidden items-end justify-start rounded-2xl p-10 md:flex'}>
				<div>
					<p className={'text-lg'}>{'Several lines description.'}</p>
					<p className={'leading-7xl text-7xl font-black'}>{'192%'}</p>
				</div>
			</div>

			<div
				className={
					'max-s:h-[400px] overflow-hidden rounded-2xl bg-cover bg-center bg-no-repeat md:mb-0 md:h-full'
				}>
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
