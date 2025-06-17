import Image from 'next/image';
import {cl} from '@lib/utils';

import type {ReactElement} from 'react';
import type {TSectionProps} from '@lib/utils/types';

export const Section5 = ({bgImage, title, description}: TSectionProps): ReactElement => (
	<div className={'md:h-section relative w-full gap-x-6'}>
		<div className={'h-64 overflow-hidden rounded-t-2xl md:h-full md:rounded-2xl'}>
			<Image
				src={bgImage ?? '/bg-placeholder.png'}
				priority
				loading={'eager'}
				alt={''}
				width={2400} /* Scaled x2 to keep quality OK */
				height={1056} /* Scaled x2 to keep quality OK */
				style={{objectFit: 'cover', width: '100%', height: '100%'}}
			/>
			<div className={'absolute inset-0 hidden grid-cols-12 gap-6 p-10 md:grid'}>
				<div
					className={cl(
						'col-span-12 md:col-span-6 lg:col-span-5',
						'w-fit',
						'bg-table flex h-full flex-col justify-between p-10 rounded-2xl'
					)}>
					<div
						className={
							'leading-4xl lg:leading-7xl text-regularText lg-text:text-7xl text-4xl font-black uppercase'
						}>
						{title}
					</div>
					<div className={'w-full rounded-2xl'}>
						<p className={'text-lg'}>{description}</p>
					</div>
				</div>
			</div>
		</div>
		<div className={'bg-table flex flex-col rounded-b-2xl p-6 md:hidden'}>
			<div className={'text-regularText mb-4 text-4xl font-black leading-[48px] lg:text-7xl'}>{title}</div>
			<div className={'w-full rounded-2xl'}>
				<p className={'text-lg'}>{description}</p>
			</div>
		</div>
	</div>
);
