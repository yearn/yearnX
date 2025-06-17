import {type ReactElement, useMemo} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {useWeb3} from '@lib/contexts/useWeb3';
import {truncateHex} from '@lib/utils';

import {IconColloboration} from '../icons/IconCollaboration';
import {LogoYearn} from '../icons/LogoYearn';

type TKatanaHeader = {
	secondLogoURL: string;
};

export function KatanaHeader({secondLogoURL}: TKatanaHeader): ReactElement {
	const {onConnect, address, ens, clusters, openLoginModal} = useWeb3();
	const ensOrClusters = useMemo(() => address && (ens || clusters?.name), [address, ens, clusters]);

	return (
		<div className={'bg-table flex items-center justify-between rounded-3xl px-4 py-2'}>
			<div className={'text-regularText flex h-12 items-center gap-x-2 rounded-xl bg-[#15181a] p-2'}>
				<LogoYearn
					className={'size-8'}
					front={'text-[#FFFFFF]'}
					back={'text-[#0657F9]'}
				/>
				<IconColloboration className={'text-regularText size-4'} />

				{/* Logo for small screens */}
				<div className={'block md:hidden'}>
					{secondLogoURL ? (
						<Image
							src={'/partnerLogo.png'}
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

				{/* Logo for medium and larger screens */}
				<div className={'hidden md:block'}>
					{secondLogoURL ? (
						<Image
							src={secondLogoURL}
							alt={'partner logo'}
							priority
							width={150}
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
			</div>
			<div className={'flex items-center gap-10'}>
				<div className={'hidden md:block'}>
					<div className={'flex items-center space-x-4'}>
						<Link
							href={'https://katana.network/'}
							target={'_blank'}
							className={'text-regularText mr-2'}>
							{'Katana Site'}
						</Link>
						<Link
							href={'https://x.com/katana'}
							className={'text-regularText font-[Aeonik] font-bold leading-3'}
							target={'_blank'}
							rel={'noopener noreferrer'}
							aria-label={'X (prev Twitter)'}>
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

				<button
					suppressHydrationWarning
					onClick={address ? openLoginModal : onConnect}
					className={'rounded-lg border border-white bg-white p-3 text-sm font-bold text-black md:px-[30px]'}>
					{ensOrClusters ? ensOrClusters : address ? truncateHex(address, 6) : 'Connect Wallet'}
				</button>
			</div>
		</div>
	);
}
