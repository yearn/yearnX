import type {TAddress, TNormalizedBN} from '@builtbymom/web3/types';

export type TVaultData = {
	name: string;
	symbol: string;
	decimals: number;
	address: TAddress;
	assetAddress: TAddress;
	assetName: string;
	assetSymbol: string;
	totalSupply: TNormalizedBN;
	balanceOf: TNormalizedBN;
};
