import Image from 'next/image';

import type {ReactElement} from 'react';

export const Section2 = ({bgImage}: {bgImage?: string}): ReactElement => {
	return (
		<div className={'h-section relative w-full gap-x-6'}>
			<div className={'h-section overflow-hidden rounded-2xl bg-cover bg-center bg-no-repeat'}>
				<Image
					src={bgImage ?? '/bg-placeholder.png'}
					alt={''}
					width={2400} /* Scaled x2 to keep quality OK */
					height={1056} /* Scaled x2 to keep quality OK */
					style={{objectFit: 'cover', width: '100%', height: '100%'}}
				/>
				<div
					style={{top: '20px', left: '20px', height: '488px'}}
					className={
						'bg-background absolute flex h-full w-2/3 flex-col justify-between rounded-2xl p-6 md:w-1/3'
					}>
					<div className={'md:leading-7xl text-3xl font-black text-white md:text-7xl'}>
						{'YEARN PARTNER VAULTS'}
					</div>
					<p>
						{
							'Several lines description. Several lines description. Several lines description. Several lines description. '
						}
					</p>
				</div>
			</div>
		</div>
	);
};
