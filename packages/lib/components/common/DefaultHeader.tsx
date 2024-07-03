import Image from 'next/image';
import Link from 'next/link';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {truncateHex} from '@builtbymom/web3/utils';
import {useAccountModal} from '@rainbow-me/rainbowkit';

import {IconColloboration} from '../icons/IconCollaboration';
import {LogoYearn} from '../icons/LogoYearn';

import type {ReactElement} from 'react';

type TDefaultHeader = {
	docsLink: string;
	secondLogoURL: string;
};

export function DefaultHeader({docsLink, secondLogoURL}: TDefaultHeader): ReactElement {
	const {onConnect, address, ens, clusters} = useWeb3();
	const {openAccountModal} = useAccountModal();
	const ensOrClusters = address && (ens || clusters?.name);

	return (
		<div className={'bg-table flex items-center justify-between rounded-3xl px-6 py-5'}>
			<div className={'flex items-center gap-10'}>
				<div className={'bg-background bg-opacity/90 flex h-12 items-center gap-x-2 rounded-xl p-2 text-white'}>
					<LogoYearn
						className={'size-8'}
						front={'text-white'}
						back={'text-[#0657F9]'}
					/>
					<IconColloboration className={'size-4 text-white'} />
					{secondLogoURL ? (
						<Image
							src={secondLogoURL}
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
				<div className={'hidden md:block'}>
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
			</div>
			<button
				suppressHydrationWarning
				onClick={address ? openAccountModal : onConnect}
				className={'rounded-lg border border-white bg-white p-3 text-sm font-bold text-black md:px-[30px]'}>
				{ensOrClusters ? ensOrClusters : address ? truncateHex(address, 6) : 'Connect Wallet'}
			</button>
		</div>
	);
}
