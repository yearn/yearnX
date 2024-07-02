import Image from 'next/image';

import bgImg from '../public/img/bg-1.png';

import type {ReactElement} from 'react';

export const Section4 = ({bgImage}: {bgImage?: string}): ReactElement => {
	return (
		<div className={'h-section flex flex-col-reverse gap-x-6 md:flex-row'}>
			<div className={'bg-table flex flex-col justify-between rounded-b-2xl p-10 md:rounded-2xl'}>
				<div className={'leading-4xl md:leading-7xl text-4xl font-black text-white md:text-7xl'}>
					{'YEARN PARTNER VAULTS'}
				</div>
				<div className={'bg-primary w-full rounded-2xl p-6'}>
					<p className={'font-black'}>{'GRAND PRIZE'}</p>
					<div className={'flex items-end'}>
						<p className={'leading-4xl md:leading-7xl text-4xl font-black md:text-7xl'}>{'123.69'}</p>
					</div>
				</div>
			</div>
			<div
				className={
					'w-full overflow-hidden rounded-t-2xl bg-cover bg-center bg-no-repeat md:w-2/3 md:rounded-2xl'
				}>
				<Image
					src={bgImage ?? bgImg}
					alt={'img'}
					className={'w-full'}
				/>
			</div>
		</div>
	);
};
