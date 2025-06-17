import {createContext, useCallback, useContext, useMemo, useState} from 'react';
import axios from 'axios';
import useWallet from '@lib/contexts/useWallet';
import {useWeb3} from '@lib/contexts/useWeb3';
import {useAsyncTrigger} from '@lib/hooks/useAsyncTrigger';
import {ETH_TOKEN_ADDRESS, toAddress, zeroNormalizedBN} from '@lib/utils';
import {acknowledge} from '@lib/utils/tools';
import {getNetwork} from '@lib/utils/wagmi';
import {useDeepCompareEffect} from '@react-hookz/web';

import type {AxiosResponse} from 'axios';
import type {Dispatch, ReactElement, SetStateAction} from 'react';
import type {TDict, TNDict, TToken, TTokenList} from '@lib/types';

type TPopularTokensProps = {
	listsURI: string[];
	onChangeListsURI: Dispatch<SetStateAction<string[]>>;
	listTokens: (chainID?: number) => TToken[];
};

const defaultProps: TPopularTokensProps = {
	listsURI: [],
	onChangeListsURI: () => {},
	listTokens: () => []
};
const POPULAR_LIST_URI = 'https://raw.githubusercontent.com/smoldapp/tokenLists/main/lists/popular.json';
const PopularTokensContext = createContext<TPopularTokensProps>(defaultProps);
export const WithPopularTokens = ({children}: {children: ReactElement}): ReactElement => {
	const {chainID} = useWeb3();
	const {balances, balanceHash, getBalance} = useWallet();
	const [listsURI, set_listsURI] = useState<string[]>([POPULAR_LIST_URI]);
	const [allTokens, set_allTokens] = useState<TNDict<TDict<TToken>>>({});
	const [tokenList, set_tokenList] = useState<TNDict<TDict<TToken>>>({});
	const hashList = useMemo((): string => listsURI.join(','), [listsURI]);

	/************************************************************************************
	 ** This is the main function that will be called when the component mounts and
	 ** whenever the hashList changes. It will fetch all the token lists from the
	 ** hashList and then add them to the tokenList state.
	 ** This is the list coming from the props.
	 ************************************************************************************/
	useAsyncTrigger(async (): Promise<void> => {
		const unhashedLists = hashList.split(',').filter(Boolean);
		if (unhashedLists.length === 0) {
			set_tokenList({});
			return;
		}
		const responses = await Promise.allSettled(
			unhashedLists.map(async (eachURI: string): Promise<AxiosResponse> => axios.get(eachURI))
		);
		const tokens: TTokenList['tokens'] = [];
		for (const [, response] of responses.entries()) {
			if (response.status === 'fulfilled') {
				tokens.push(...(response.value.data as TTokenList).tokens);
			}
		}

		const tokenListTokens: TNDict<TDict<TToken>> = {};
		for (const eachToken of tokens) {
			if (!tokenListTokens[eachToken.chainId]) {
				tokenListTokens[eachToken.chainId] = {};
			}
			if (!tokenListTokens[eachToken.chainId][toAddress(eachToken.address)]) {
				tokenListTokens[eachToken.chainId][toAddress(eachToken.address)] = {
					address: eachToken.address,
					name: eachToken.name,
					symbol: eachToken.symbol,
					decimals: eachToken.decimals,
					chainID: eachToken.chainId,
					logoURI: eachToken.logoURI,
					value: 0,
					balance: zeroNormalizedBN
				};
			}
		}
		set_tokenList(tokenListTokens);
	}, [hashList]);

	/**********************************************************************************************
	 ** This useEffect hook will be triggered when the currentNetworkTokenList or safeChainID
	 ** changes, indicating that we need to update the list of tokens with balance to match the
	 ** current network.
	 *********************************************************************************************/
	useDeepCompareEffect((): void => {
		const possibleDestinationsTokens: TNDict<TDict<TToken>> = {};
		for (const [networkID, eachNetwork] of Object.entries(tokenList)) {
			if (!possibleDestinationsTokens[Number(networkID)]) {
				possibleDestinationsTokens[Number(networkID)] = {};
				const {nativeCurrency} = getNetwork(Number(networkID));
				if (nativeCurrency) {
					possibleDestinationsTokens[Number(networkID)][ETH_TOKEN_ADDRESS] = {
						address: ETH_TOKEN_ADDRESS,
						chainID: Number(networkID),
						name: nativeCurrency.name,
						symbol: nativeCurrency.symbol,
						decimals: nativeCurrency.decimals,
						value: 0,
						balance: zeroNormalizedBN,
						logoURI: `${process.env.SMOL_ASSETS_URL}/token/${Number(networkID)}/${ETH_TOKEN_ADDRESS}/logo-32.png`
					};
				}
			}

			for (const eachToken of Object.values(eachNetwork)) {
				if (eachToken.address === toAddress('0x0000000000000000000000000000000000001010')) {
					continue; //ignore matic erc20
				}
				possibleDestinationsTokens[Number(networkID)][toAddress(eachToken.address)] = eachToken;
			}
		}
		set_allTokens(possibleDestinationsTokens);
	}, [tokenList]);

	/**********************************************************************************************
	 ** This function will be used to get the list of tokens with or without balance. It will be
	 ** triggered when the allTokens or getBalance or isCustomToken or balanceHash changes.
	 *********************************************************************************************/
	const listTokens = useCallback(
		(_chainID?: number): TToken[] => {
			acknowledge(balanceHash);
			if (_chainID === undefined) {
				_chainID = chainID;
			}

			const withBalance = [];
			for (const [networkID, eachNetwork] of Object.entries(allTokens)) {
				if (Number(networkID) !== _chainID) {
					continue;
				}

				for (const dest of Object.values(eachNetwork)) {
					const balance = getBalance({address: dest.address, chainID: dest.chainID});
					withBalance.push({...dest, balance});
				}
			}

			//We need to do the same with balances
			for (const [networkID, eachNetwork] of Object.entries(balances)) {
				if (Number(networkID) !== _chainID) {
					continue;
				}

				for (const token of Object.values(eachNetwork)) {
					if (token) {
						const balance = getBalance({address: token.address, chainID: token.chainID});
						withBalance.push({...token, balance});
					}
				}
			}

			const noDuplicates: TToken[] = [];
			for (const token of withBalance) {
				if (!noDuplicates.find(t => t.address === token.address && t.chainID === token.chainID)) {
					noDuplicates.push(token);
				}
			}
			return noDuplicates;
		},
		[balanceHash, chainID, allTokens, getBalance, balances]
	);

	return (
		<PopularTokensContext.Provider
			value={{
				listTokens,
				listsURI,
				onChangeListsURI: set_listsURI
			}}>
			{children}
		</PopularTokensContext.Provider>
	);
};

export const usePopularTokens = (): TPopularTokensProps => {
	const ctx = useContext(PopularTokensContext);
	if (!ctx) {
		throw new Error('PopularTokensContext not found');
	}
	return ctx;
};
