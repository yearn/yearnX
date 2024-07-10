import * as all from 'viem/chains';

import type {TAddress} from '@builtbymom/web3/types';

const {...chains} = all;

export function getChain(chainId: number): string {
	for (const chain of Object.values(chains)) {
		if (chain.id === chainId) {
			return chain.name;
		}
	}
	return '';
}

export function allowanceKey(chainID: number, token: TAddress, spender: TAddress, owner: TAddress): string {
	return `${chainID}_${token}_${spender}_${owner}`;
}
