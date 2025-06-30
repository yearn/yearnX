import Image from 'next/image';
import {cl} from '@lib/utils';

import type {ReactElement} from 'react';
import type {TSectionProps} from '@lib/utils/types';

export const KatanaSection = ({bgImage}: TSectionProps): ReactElement => (
	<div
		className={'lg-text:grid lg-text:grid-cols-12 lg-text:gap-6 flex min-h-32 w-full flex-col'}
		style={{alignItems: 'stretch'}}>
		<div
			className={cl(
				'col-span-12 md:col-span-12',
				'w-full overflow-hidden rounded-t-2xl bg-cover bg-center bg-no-repeat md:rounded-2xl bg-table'
			)}
			style={{
				display: 'flex',
				flexDirection: 'column',
				minHeight: '64px',
				aspectRatio: '5.82' // Ensures the image maintains its aspect ratio,
			}}>
			<Image
				src={bgImage ?? '/bg-placeholder.png'}
				priority
				loading={'eager'}
				alt={''}
				className={'w-full'}
				width={1280} /* Scaled x2 to keep quality OK */
				height={350} /* Scaled x2 to keep quality OK */
				style={{
					objectFit: 'cover',
					width: '100%',
					height: '100%',
					overflow: 'hidden'
				}}
			/>
		</div>

	</div>
);
