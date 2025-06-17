import Image from 'next/image';
import {cl} from '@lib/utils';

import type {ReactElement} from 'react';
import type {TSectionProps} from '@lib/utils/types';

export const Section6 = ({title, bgImage, description}: TSectionProps): ReactElement => (
	<div className={'md:h-min-h-52 flex min-h-52 w-full grid-cols-12 flex-col-reverse md:grid md:gap-6'}>
		<div
			className={cl(
				'col-span-12 md:col-span-5',
				'bg-table flex flex-col justify-between rounded-b-2xl p-6 md:p-10 md:rounded-2xl'
			)}>
			<div
				className={
					'md:leading-4xl md:leading-7xl text-regularText lg-text:text-7xl mb-4 text-4xl font-black uppercase leading-[48px] md:mb-0'
				}>
				{title}
			</div>
			<div className={'w-full rounded-2xl'}>
				<p className={'text-lg'}>{description}</p>
			</div>
		</div>
		<div
			className={cl(
				'col-span-12 md:col-span-7',
				'w-full overflow-hidden rounded-t-2xl bg-cover min-h-64 md:min-h-max bg-center bg-no-repeat md:rounded-2xl'
			)}>
			<Image
				src={bgImage ?? '/bg-placeholder.png'}
				priority
				loading={'eager'}
				alt={''}
				className={'w-full'}
				width={1408} /* Scaled x2 to keep quality OK */
				height={1056} /* Scaled x2 to keep quality OK */
				style={{objectFit: 'cover', width: '100%', height: '100%'}}
			/>
		</div>
	</div>
);
