import Image from 'next/image';
import Link from 'next/link';

import {IconColloboration} from '../../lib/components/icons/IconCollaboration';
import {LogoYearn} from '../../lib/components/icons/LogoYearn';

import type {ReactElement} from 'react';

export function Footer(): ReactElement {
	return (
		<div className={'bg-table flex items-center justify-between rounded-2xl p-4 md:hidden'}>
			<div className={'bg-background flex items-center gap-x-2 rounded-xl p-2'}>
				<LogoYearn
					className={'size-8'}
					front={'text-white'}
					back={'text-[#0657F9]'}
				/>
				<IconColloboration className={'size-4 text-white'} />
				<Image
					src={'/partnerLogo.png'}
					alt={'partner logo'}
					priority
					width={32}
					height={32}
				/>
			</div>
			<div className={'flex gap-x-6'}>
				<Link
					target={'_blank'}
					href={'https://katana.network/'}>
					{'Katana Site'}
				</Link>
				<Link
					target={'_blank'}
					href={'https://x.com/katana'}>
					<svg
						xmlns={'http://www.w3.org/2000/svg'}
						viewBox={'0 0 24 24'}
						fill={'currentColor'}
						className={'size-5 align-middle'}>
						<path
							d={
								'M17.53 3H21.5l-7.19 8.21L22.75 21h-6.56l-5.18-6.16L4.47 21H0.5l7.67-8.76L1.25 3h6.69l4.67 5.55L17.53 3zm-1.15 15.19h1.82L6.62 4.62H4.68l11.7 13.57z'
							}
						/>
					</svg>
				</Link>
			</div>
		</div>
	);
}
