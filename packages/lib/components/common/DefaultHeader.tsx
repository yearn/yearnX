import {type ReactElement, useMemo} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {truncateHex} from '@builtbymom/web3/utils';
import {useAccountModal} from '@rainbow-me/rainbowkit';

import {IconColloboration} from '../icons/IconCollaboration';
import {LogoYearn} from '../icons/LogoYearn';

type TDefaultHeader = {
	docsLink: string;
	secondLogoURL: string;
};

export function DefaultHeader({docsLink, secondLogoURL}: TDefaultHeader): ReactElement {
	const {onConnect, address, ens, clusters} = useWeb3();
	const {openAccountModal} = useAccountModal();
	const ensOrClusters = useMemo(() => address && (ens || clusters?.name), [address, ens, clusters]);

	return (
		<div className={'bg-table flex items-center justify-between rounded-3xl px-6 py-5'}>
			<div className={'flex items-center gap-10'}>
				<div className={'bg-headerTag/90 text-regularText flex h-12 items-center gap-x-2 rounded-xl p-2'}>
					<LogoYearn
						className={'size-8'}
						front={'text-[#FFFFFF]'}
						back={'text-[#0657F9]'}
					/>
					<IconColloboration className={'text-regularText size-4'} />
					{secondLogoURL ? (
						<Image
							src={secondLogoURL}
							alt={'partner logo'}
							priority
							width={32}
							height={32}
						/>
					) : (
						<LogoYearn
							className={'size-8'}
							front={'text-white'}
							back={'text-regularText'}
						/>
					)}
				</div>
				<div className={'hidden md:block'}>
					<Link
						href={docsLink || ''}
						className={'text-regularText mr-6'}>
						{'Docs'}
					</Link>
					<Link
						href={''}
						className={'text-regularText font-[Aeonik] font-bold leading-3'}>
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
