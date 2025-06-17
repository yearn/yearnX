import {Fragment, type ReactElement} from 'react';
import Image from 'next/image';
import {Counter} from '@lib/components/common/Counter';
import {cl, formatLocalAmount} from '@lib/utils';

import type {TSectionProps} from '@lib/utils/types';

export const Section4 = ({bgImage, title, description, cards}: TSectionProps): ReactElement => {
	if (!cards || cards.length === 0) {
		throw new Error('Section4: cards prop is required');
	}

	return (
		<div className={'md:h-section min-h-section flex flex-col-reverse gap-2 md:grid md:grid-cols-3 md:gap-6'}>
			<div className={'bg-table flex items-end justify-start rounded-2xl p-6 md:hidden'}>
				<div>
					<b className={'block'}>{title}</b>
					<p>{description}</p>
					<p className={'text-4xl font-bold leading-[48px]'}>
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
								<span className={'mb-1 pl-2 font-mono text-xl font-bold lg:mb-2'}>
									{cards[0].currency}
								</span>
							</Fragment>
						)}
					</p>
				</div>
			</div>
			<div className={'bg-table flex flex-col justify-between rounded-2xl p-6 lg:p-10'}>
				<div
					className={
						'lg:leading-7xl text-regularText lg-text:text-7xl text-4xl font-black uppercase leading-[48px]'
					}>
					{title}
				</div>
				<p className={'text-lg'}>{description}</p>
			</div>

			<div className={'bg-table hidden items-end justify-start rounded-2xl p-10 md:flex'}>
				<div>
					<p className={'text-lg'}>{cards[0].title}</p>
					<div className={'relative text-3xl font-black lg:text-8xl'}>
						<div className={cl('transition-opacity', cards[0].isReady ? 'opacity-100' : 'opacity-0')}>
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
									<span className={'mb-1 pl-2 font-mono text-xl font-bold lg:mb-2'}>
										{cards[0].currency}
									</span>
								</Fragment>
							)}
						</div>
						<div
							className={cl(
								'absolute inset-0 transition-opacity',
								cards[0].isReady ? 'opacity-0' : 'opacity-100'
							)}>
							<span
								className={'bg-regularText/20 mt-2.5 inline-block h-14 w-3/4 animate-pulse rounded-md'}
							/>
						</div>
					</div>
				</div>
			</div>

			<div
				className={
					'max-s:h-[400px] overflow-hidden rounded-2xl bg-cover bg-center bg-no-repeat md:mb-0 md:h-full'
				}>
				<Image
					className={'size-full md:w-0'}
					src={bgImage ?? '/bg-placeholder.png'}
					priority
					loading={'eager'}
					alt={''}
					width={768} /* Scaled x2 to keep quality OK */
					height={1056} /* Scaled x2 to keep quality OK */
					style={{objectFit: 'cover', width: '100%', height: '100%'}}
				/>
			</div>
		</div>
	);
};
