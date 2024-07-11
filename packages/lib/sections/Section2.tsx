import Image from 'next/image';
import {cl} from '@builtbymom/web3/utils';
import {Counter} from '@lib/components/common/Counter';

import type {ReactElement} from 'react';
import type {TSectionProps} from '@lib/utils/types';

export const Section2 = ({title, description, bgImage, cards}: TSectionProps): ReactElement => {
	if (!cards || cards.length === 0) {
		throw new Error('Section2: cards prop is required');
	}
	return (
		<div className={'h-section min-h-section flex w-full grid-cols-12 flex-col-reverse md:grid md:gap-6'}>
			<div
				className={cl(
					'col-span-12 md:col-span-5',
					'bg-table flex flex-col justify-between rounded-b-2xl p-10 md:rounded-2xl'
				)}>
				<div>
					<div
						className={
							'leading-4xl md:leading-7xl text-regularText whitespace-break-spaces text-4xl font-black md:text-7xl'
						}>
						{title}
					</div>
					<div className={'mt-6 w-full rounded-2xl'}>
						<p className={'text-lg'}>{description}</p>
					</div>
				</div>
				<div className={'bg-primary text-accentText w-full rounded-2xl p-6'}>
					<b className={'block'}>{cards[0].title}</b>
					<div className={'flex items-end'}>
						<p className={'leading-4xl md:leading-7xl w-full font-mono text-4xl font-black md:text-7xl'}>
							{cards[0].isReady ? (
								<Counter
									value={cards[0].value}
									decimals={cards[0].decimals}
									decimalsToDisplay={[2, 4, 6, 8]}
									idealDecimals={2}
								/>
							) : (
								<span
									className={'bg-regularText/20 inline-block h-14 w-3/4 animate-pulse rounded-md'}
								/>
							)}
							{cards[0].isReady ? (
								<span className={'pl-2 font-mono text-xl font-bold'}>{cards[0].currency}</span>
							) : null}
						</p>
					</div>
				</div>
			</div>
			<div className={cl('col-span-12 md:col-span-7', 'size-full overflow-hidden rounded-t-2xl md:rounded-2xl')}>
				<Image
					src={bgImage ?? '/bg-placeholder.png'}
					priority
					alt={''}
					width={1408} /* Scaled x2 to keep quality OK */
					height={1056} /* Scaled x2 to keep quality OK */
					style={{objectFit: 'cover', width: '100%', height: '100%'}}
				/>
			</div>
		</div>
	);
};
