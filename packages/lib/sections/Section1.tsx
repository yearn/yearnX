import Image from 'next/image';

import bgImg from '../public/img/bg-section.png';

import type {ReactElement} from 'react';

export const Section1 = ({bgImage}: {bgImage?: string}): ReactElement => {
	return (
		<div className={'h-section grid grid-rows-3 gap-y-6 md:grid-cols-3 md:gap-x-6'}>
			<div className={'bg-table flex flex-col justify-between rounded-2xl p-10'}>
				<div className={'leading-4xl md:leading-7xl text-4xl font-black text-white md:text-7xl'}>
					{'YEARN PARTNER VAULTS'}
				</div>
				<p>
					{
						'Several lines description. Several lines description. Several lines description. Several lines description. '
					}
				</p>
			</div>
			<div className={'bg-table flex items-end justify-start rounded-2xl p-10'}>
				<div>
					<p>{'Several lines description.'}</p>
					<p className={'leading-7xl text-7xl font-black'}>{'192%'}</p>
				</div>
			</div>
			<div className={'md:h-section h-80 overflow-hidden rounded-2xl bg-cover bg-center bg-no-repeat md:mb-0'}>
				<Image
					className={'size-full  md:w-0'}
					src={bgImage ?? bgImg}
					alt={''}
				/>
			</div>
		</div>
	);
};
