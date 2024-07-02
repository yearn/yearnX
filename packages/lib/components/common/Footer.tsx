import Image from 'next/image';
import Link from 'next/link';

import {IconColloboration} from '../icons/IconCollaboration';
import {LogoYearn} from '../icons/LogoYearn';

import type {ReactElement} from 'react';

type TFooterProps = {
	docsLink: string;
	secondLogoURL: string;
};

export function Footer(props: TFooterProps): ReactElement {
	return (
		<div className={'bg-table mb-6 flex items-center justify-between rounded-2xl p-4 md:hidden'}>
			<div className={'bg-background flex items-center gap-x-2 rounded-xl p-2'}>
				<LogoYearn
					className={'size-8'}
					front={'text-white'}
					back={'text-[#0657F9]'}
				/>
				<IconColloboration className={'size-4 text-white'} />
				{props.secondLogoURL ? (
					<Image
						src={props.secondLogoURL}
						alt={''}
					/>
				) : (
					<LogoYearn
						className={'size-8'}
						front={'text-white'}
						back={'text-black'}
					/>
				)}
			</div>
			<div className={'flex gap-x-2'}>
				<Link href={'/'}>{'Docs'}</Link>
				<Link href={'/'}>{'X'}</Link>
			</div>
		</div>
	);
}
