import Link from 'next/link';
import {getNetwork} from '@lib/utils/wagmi';

import {IconExternalLink} from '../icons/IconExternalLink';
import {ImageWithFallback} from './ImageWithFallback';

import type {ReactElement} from 'react';
import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';

type TVaultLinkProps = {
	yearnfiLink: string;
	vault: TYDaemonVault;
};

export const VaultLink = (props: TVaultLinkProps): ReactElement => (
	<Link
		href={props.yearnfiLink}
		target={'_blank'}
		className={
			'border-regularText/15 bg-regularText/5 mb-2 flex w-full cursor-alias items-center rounded-lg border px-4 py-2'
		}>
		<div className={'flex w-full cursor-alias items-center'}>
			<ImageWithFallback
				src={`https://assets.smold.app/tokens/${props.vault.chainID}/${props.vault.token.address}/logo-32.png`}
				alt={props.vault.token.symbol}
				width={28}
				height={28}
			/>
			<div className={'ml-2 flex w-48 flex-col md:w-80'}>
				<div className={'flex w-full items-center justify-between gap-x-2'}>
					<p className={'md:regularTextspace-nowrap w-full text-left'}>{props.vault.name}</p>
				</div>

				<p className={'text-regularText/50 flex w-full justify-start'}>
					{getNetwork(props.vault.chainID).name}
				</p>
			</div>
		</div>

		<IconExternalLink className={'size-4'} />
	</Link>
);
