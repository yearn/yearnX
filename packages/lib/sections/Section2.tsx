import {Fragment, type ReactElement} from 'react';
import Image from 'next/image';
import {Counter} from '@lib/components/common/Counter';
import {cl, formatLocalAmount} from '@lib/utils';

import type {TSectionProps} from '@lib/utils/types';

export const Section2 = ({title, bgImage, cards}: TSectionProps): ReactElement => {
	if (!cards || cards.length === 0) {
		throw new Error('Section2: cards prop is required');
	}
	return (
		<div className={'flex w-full grid-cols-12 flex-col-reverse md:grid md:gap-6'}>
			<div
				className={cl(
					'col-span-12 md:col-span-5',
					'bg-table flex flex-col justify-between rounded-b-2xl p-6 md:p-10 md:rounded-2xl'
				)}>
				<div className={'bg-table'}>
					<div
						className={
							'leading-4xl lg:leading-7xl text-regularText lg-text:text-7xl mb-4 whitespace-break-spaces text-4xl font-black uppercase md:mb-0'
						}>
						{title}
					</div>
				</div>
				<div className={'bg-primary text-accentText w-full rounded-2xl p-6'}>
					<b className={'block text-lg uppercase leading-[22px]'}>{cards[0].title}</b>
					<div className={'flex items-end'}>
						<div className={'flex w-full items-end font-mono font-black'}>
							{cards[0].isReady ? (
								<div className={'text-3xl lg:text-7xl'}>
									{cards[0].currency === 'USD' && cards[0].value > 100_000 ? (
										formatLocalAmount(cards[0].value, 4, '$', {
											displayDigits: 2,
											maximumFractionDigits: 2,
											minimumFractionDigits: 2,
											shouldCompactValue: true
										})
									) : (
										<Fragment>
											<Counter
												value={cards[0].value}
												decimals={cards[0].decimals ?? 0}
												decimalsToDisplay={[2, 4, 6, 8]}
												idealDecimals={2}
											/>
											{cards[0].currency}
										</Fragment>
									)}
								</div>
							) : (
								<span
									className={'bg-regularText/20 inline-block h-14 w-3/4 animate-pulse rounded-md'}
								/>
							)}
						</div>
					</div>
				</div>
			</div>
			<div
				className={cl(
					'col-span-12 md:col-span-7',
					'size-full overflow-hidden rounded-t-2xl md:rounded-2xl md:min-h-[528px] md:max-h-[528px]'
				)}>
				<Image
					src={bgImage ?? '/bg-placeholder.png'}
					priority
					loading={'eager'}
					alt={''}
					width={1408} /* Scaled x2 to keep quality OK */
					height={1056} /* Scaled x2 to keep quality OK */
					style={{objectFit: 'cover', width: '100%', height: '100%'}}
				/>
			</div>
		</div>
	);
};
