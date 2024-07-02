import Image from 'next/image';

import type {ReactElement} from 'react';

export const Section3 = ({bgImage}: {bgImage?: string}): ReactElement => {
	return (
		<div className={'flex flex-col gap-y-6'}>
			<div className={'h-section flex flex-col-reverse gap-x-6 md:flex-row'}>
				<div className={'bg-table flex flex-col justify-between rounded-b-2xl p-10 md:rounded-2xl'}>
					<div className={'leading-4xl md:leading-7xl text-4xl font-black text-white md:text-7xl'}>
						{'YEARN PARTNER VAULTS'}
					</div>
					<div className={'bg-primary mt-5 w-full rounded-2xl p-6 md:mt-0'}>
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
						src={bgImage ?? '/bg-placeholder.png'}
						alt={'img'}
						className={'w-full'}
						width={1408} /* Scaled x2 to keep quality OK */
						height={1056} /* Scaled x2 to keep quality OK */
						style={{objectFit: 'cover', width: '100%', height: '100%'}}
					/>
				</div>
			</div>

			<div className={'bg-table grid w-full grid-rows-3 gap-y-6 rounded-2xl p-10 md:grid-cols-3 md:gap-x-6'}>
				<div className={'flex flex-col'}>
					<p className={'font-black md:mb-2'}>{'GRAND PRIZE'}</p>
					<p className={'text-3xl font-black md:text-7xl'}>{'123.69'}</p>
				</div>
				<div className={'flex flex-col'}>
					<p className={'font-black md:mb-2'}>{'GRAND PRIZE'}</p>
					<p className={'text-3xl font-black  md:text-7xl'}>{'123.69'}</p>
				</div>
				<div className={'flex flex-col'}>
					<p className={'font-black md:mb-2'}>{'GRAND PRIZE'}</p>
					<p className={'text-3xl font-black  md:text-7xl'}>{'123.69'}</p>
				</div>
			</div>
		</div>
	);
};
