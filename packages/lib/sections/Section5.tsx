import Image from 'next/image';

import type {ReactElement} from 'react';
import type {TSectionProps} from '@lib/utils/types';

export const Section5 = ({bgImage, description}: TSectionProps): ReactElement => {
	return (
		<div className={'h-section flex flex-col-reverse gap-x-6 md:flex-row'}>
			<div className={'bg-table flex flex-col justify-between rounded-b-2xl p-10 md:rounded-2xl'}>
				<div className={'leading-4xl md:leading-7xl text-4xl font-black text-white md:text-7xl'}>
					{'YEARN PARTNER VAULTS'}
				</div>
				<div className={'bg-primary w-full rounded-2xl p-6'}>
					<p>{description}</p>
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
	);
};
