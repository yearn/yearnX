import Image from 'next/image';
import {Button} from '@lib/components/common/Button';
import {IconYearnLogo} from '@lib/components/icons/IconYearnLogo';

import type {ReactElement} from 'react';

export function Hero(): ReactElement {
	return (
		<div
			style={{
				backgroundImage: "url('/grid.png')"
			}}
			className={
				'border-regularText z-1 relative m-4 flex h-[600px] justify-center rounded-[40px] bg-blend-color-dodge'
			}>
			<div
				style={{backgroundImage: "url('/header-bg.png')"}}
				className={'absolute z-0 size-full rounded-[40px] opacity-[0.08]'}
			/>
			<Image
				className={
					'absolute right-0 top-0 z-10 hidden h-[600px] max-h-[600px] rounded-[40px] opacity-100 bg-blend-color-dodge lg:block'
				}
				src={'/img_hero.png'}
				priority
				loading={'eager'}
				alt={''}
				width={'800'}
				height={'700'}
			/>
			<Image
				className={
					'absolute right-0 top-0 z-10 block max-h-[600px] rounded-[40px] opacity-100 bg-blend-color-dodge md:hidden'
				}
				src={'/img_hero_mob.png'}
				priority
				loading={'eager'}
				alt={''}
				width={'385'}
				height={'315'}
			/>
			<Image
				className={
					'absolute right-0 top-0 z-10 hidden max-h-[600px] rounded-[40px] opacity-100 bg-blend-color-dodge md:block lg:hidden'
				}
				src={'/img_hero_md.png'}
				priority
				loading={'eager'}
				alt={''}
				width={'700'}
				height={'700'}
			/>
			<div className={'z-30 flex w-full max-w-6xl justify-between py-20'}>
				<div className={'mt-60 flex flex-col md:mt-0'}>
					<div className={'mb-6 size-16 md:mb-20'}>
						<IconYearnLogo className={'z-20 '} />
					</div>
					<span className={'text-regularText text-3xl font-bold  md:text-[80px] md:leading-[80px]'}>
						{'Yearn X'}
					</span>
					<div className={'mb-6 mt-2 max-w-screen-sm text-base font-normal md:mb-16 md:mt-6 md:text-lg'}>
						{
							'The best risk adjusted yields in DeFi, on the best protocols in crypto. Yearn X takes you straight to Yearn Vaults from some of the most popular crypto ecosystems.'
						}
					</div>

					<Button
						onClick={() => {
							const element = document.getElementById('partners');
							element?.scrollIntoView({behavior: 'smooth'});
						}}
						className={'bg-button w-full !rounded-3xl px-8 py-4 !text-base md:w-40'}>
						{'To the yield!'}
					</Button>
				</div>
				<div />
			</div>
		</div>
	);
}
