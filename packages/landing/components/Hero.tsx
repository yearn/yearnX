import Image from 'next/image';
import {Button} from '@lib/components/common/Button';
import {LogoYearn} from '@lib/components/icons/LogoYearn';

import type {ReactElement} from 'react';

export function Hero(): ReactElement {
	return (
		<div
			style={{
				backgroundImage: "url('/grid.png')"
				// backgroundRepeat: 'repeat'
				// background: 'lightgray 0% 0% / 30.000001192092896px 30.000001192092896px'
			}}
			className={
				'border-regularText z-1 relative m-4 flex h-[600px] justify-center rounded-[40px] bg-blend-color-dodge'
			}>
			<div
				style={{backgroundImage: "url('/header-bg.png')"}}
				className={'absolute z-0 size-full rounded-[40px] opacity-[0.06]'}
			/>
			<Image
				className={'absolute right-0 top-0 z-10 max-h-[600px] rounded-[40px] opacity-100 bg-blend-color-dodge'}
				src={'/img_hero.png'}
				alt={''}
				width={'800'}
				height={'700'}
				fetchPriority={'high'}
			/>
			<div className={'z-30 flex w-full max-w-6xl justify-between py-20'}>
				<div>
					<LogoYearn
						className={'mb-20 size-14'}
						front={'text-[#FFFFFF]'}
						back={'text-[#0657F9]'}
					/>
					<span className={'text-regularText text-[80px] font-bold leading-[80px]'}>
						{'Yearn X Partners'}
					</span>
					<div className={'mb-16 mt-6 max-w-screen-sm text-lg font-normal'}>
						{'Yearn x Partners headline text description example'}
						{'headline text description example'}
					</div>

					<Button className={'bg-button !rounded-3xl px-8 py-4 !text-base'}>{'Launch App'}</Button>
				</div>
				<div />
			</div>
		</div>
	);
}
