import type {TAddress, TNormalizedBN, TToken} from '@builtbymom/web3/types';

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

export type TVaultsSortBy = 'vault' | 'apr' | 'deposits' | 'balance';

export type TSectionProps = {
	bgImage?: string;
	description?: string;
	title: string;
	cards?: {
		title: string;
		currency?: string;
		value: number;
		decimals?: number;
		isReady: boolean;
	}[];
};

export type TTokenAmountInputElement = {
	amount: string;
	value?: number;
	normalizedBigAmount: TNormalizedBN;
	token: TToken | undefined;
	status: 'pending' | 'success' | 'error' | 'none';
	isValid: boolean | 'undetermined';
	error?: string | undefined;
	UUID: string;
};

export type TTokenToUse = Partial<{token: TToken; amount: TNormalizedBN}>;
export type TAssertedTokenToUse = {token: TToken; amount: TNormalizedBN};
