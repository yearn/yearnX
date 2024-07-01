import Image from 'next/image';
import Link from 'next/link';
import {useAccountModal} from '@rainbow-me/rainbowkit';

import {IconColloboration} from '../icons/IconCollaboration';

import type {ReactElement} from 'react';

type TDefaultHeader = {
	docsLink: string;
	firstLogoURL: string;
	secondLogoURL: string;
};

export function DefaultHeader({docsLink, firstLogoURL, secondLogoURL}: TDefaultHeader): ReactElement {
	const {openAccountModal} = useAccountModal();

	return (
		<div className={'bg-table flex items-center justify-between rounded-3xl px-6 py-5'}>
			<div className={'flex items-center'}>
				<div
					className={
						'bg-background bg-opacity/90 mr-10 flex h-12 items-center gap-x-2 rounded-xl p-2 text-white'
					}>
					<Image
						src={firstLogoURL}
						alt={''}
					/>
					<IconColloboration className={'size-4 text-white'} />
					<Image
						src={secondLogoURL}
						alt={''}
					/>
				</div>
				<Link
					href={docsLink || ''}
					className={'mr-6 text-white'}>
					{'Docs'}
				</Link>
				<Link
					href={''}
					className={'font-[Aeonik] font-bold leading-3 text-white'}>
					{'X'}
				</Link>
			</div>
			<button
				suppressHydrationWarning
				onClick={openAccountModal}
				className={'rounded-lg border border-white bg-white px-[30px] py-3 text-sm font-bold'}>
				{'Connect Wallet'}
			</button>
		</div>
	);
}
