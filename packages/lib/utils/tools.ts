import * as all from 'viem/chains';

import type {TAddress} from '@lib/types';

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

export function toPercent(value: number): string {
	return `${(value * 100).toFixed(2)}%`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function acknowledge(..._args: unknown[]): void {
	// Do nothing. This function is used to acknowledge that the args are not used and disable some
	// linting errors.
	// Also should help fixing Warning: Cannot update a component while rendering a different component error.
}

export function getDifference(item: string, searchTerm: string): number {
	if (item.startsWith(searchTerm)) {
		return item.length - searchTerm.length; // Difference is the extra characters beyond the search term
	}
	return item.length + searchTerm.length; // Large difference if not starting with searchTerm
}
