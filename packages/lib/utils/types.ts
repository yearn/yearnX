import type {TAddress, TNormalizedBN, TToken} from '@lib/types';

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

export type TVaultsSortBy = 'vault' | 'apy' | 'deposits' | 'balance' | null;

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

export type TTokenNoBalance = Omit<TToken, 'balance'>;
export type TTokenToUse = Partial<{token: TTokenNoBalance; amount: TNormalizedBN}>;
export type TAssertedTokenToUse = {token: TTokenNoBalance; amount: TNormalizedBN};
export type TAPYType = 'HISTORICAL' | 'ESTIMATED';
