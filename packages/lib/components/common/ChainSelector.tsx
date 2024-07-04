import {getNetwork} from '@builtbymom/web3/utils/wagmi';

import {IconChevron} from '../icons/IconChevron';
import {ImageWithFallback} from './ImageWithFallback';

import type {ReactElement} from 'react';
import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';

export function ChainSelector({vault}: {vault: TYDaemonVault}): ReactElement {
	return (
		<div className={'flex !h-16 items-center gap-x-1 rounded-lg border border-white/15 bg-white/5 px-4 py-3'}>
			<ImageWithFallback
				src={`https://assets.smold.app/tokens/${vault.chainID}/${vault.token.address}/logo-128.png`}
				alt={getNetwork(1).name}
				width={32}
				height={32}
			/>
			<IconChevron className={'size-4 text-white'} />
		</div>
	);
}
