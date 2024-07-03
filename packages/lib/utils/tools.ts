import * as all from 'viem/chains';

const {...chains} = all;

export function getChain(chainId: number): string {
	for (const chain of Object.values(chains)) {
		if (chain.id === chainId) {
			return chain.name;
		}
	}
	return '';
}
