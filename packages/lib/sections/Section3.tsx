import {type ReactElement} from 'react';
import Image from 'next/image';
import {cl} from '@builtbymom/web3/utils';
import {Counter} from '@lib/components/common/Counter';

import type {TSectionProps} from '@lib/utils/types';

export const Section3 = ({title, description, bgImage, cards}: TSectionProps): ReactElement => {
	if (!cards || cards.length === 0) {
		throw new Error('Section2: cards prop is required');
	}
	return (
		<div className={'grid gap-6'}>
			<div className={'md:h-section min-h-section flex w-full grid-cols-12 flex-col-reverse md:grid md:gap-6'}>
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

			<div
				className={
					'bg-primary text-accentText grid w-full grid-cols-1 gap-y-12 rounded-2xl p-6 md:grid-cols-3 md:gap-x-6 md:px-10 md:py-16'
				}>
				{cards.map(card => (
					<div key={card.value}>
						{card.isReady && (
							<p className={'mb-4 text-lg font-bold uppercase leading-[22px] md:mb-0'}>{card.title}</p>
						)}
						{card.isReady && (
							<div className={'text-3xl font-bold lg:text-7xl'}>
								<Counter
									value={card.value}
									decimals={card.decimals ?? 0}
									decimalsToDisplay={[2, 4, 6, 8]}
									idealDecimals={2}
								/>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
};
