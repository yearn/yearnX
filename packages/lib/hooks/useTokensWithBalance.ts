import {useCallback, useState} from 'react';
import useWallet from '@lib/contexts/useWallet';
import {useWeb3} from '@lib/contexts/useWeb3';
import {useTokenList} from '@lib/contexts/WithTokenList';
import {ETH_TOKEN_ADDRESS, toAddress, zeroNormalizedBN} from '@lib/utils';
import {acknowledge} from '@lib/utils/tools';
import {getNetwork} from '@lib/utils/wagmi';
import {useDeepCompareEffect} from '@react-hookz/web';

import type {TChainTokens, TDict, TNDict, TToken} from '@lib/types';

export function useTokensWithBalance(): {
	listAllTokensWithBalance: () => TToken[];
	listTokensWithBalance: (chainID?: number) => TToken[];
	listTokens: (chainID?: number) => TToken[];
	isLoading: boolean;
	isLoadingOnCurrentChain: boolean;
	isLoadingOnChain: (chainID?: number) => boolean;
	onRefresh: () => Promise<TChainTokens>;
} {
	const {chainID} = useWeb3();
	const {balanceHash, getBalance, isLoading, isLoadingOnCurrentChain, isLoadingOnChain, onRefresh} = useWallet();
	const [allTokens, set_allTokens] = useState<TNDict<TDict<TToken>>>({});
	const {tokenLists, isCustomToken} = useTokenList();

	/**********************************************************************************************
	 ** This useEffect hook will be triggered when the currentNetworkTokenList or safeChainID
	 ** changes, indicating that we need to update the list of tokens with balance to match the
	 ** current network.
	 *********************************************************************************************/
	useDeepCompareEffect((): void => {
		const possibleDestinationsTokens: TNDict<TDict<TToken>> = {};
		for (const [networkID, eachNetwork] of Object.entries(tokenLists)) {
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
	}, [tokenLists]);

	/**********************************************************************************************
	 ** This function will be used to get the list of tokens with balance. It will be triggered
	 ** when the allTokens or getBalance or isCustomToken or balanceHash changes.
	 *********************************************************************************************/
	const listTokensWithBalance = useCallback(
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
					// force displaying extra tokens along with other tokens with balance
					if (balance.raw > 0n || isCustomToken({address: dest.address, chainID: dest.chainID})) {
						withBalance.push({...dest, balance});
					}
				}
			}
			return withBalance;
		},
		[allTokens, getBalance, isCustomToken, balanceHash, chainID]
	);

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
			return withBalance;
		},
		[allTokens, getBalance, balanceHash, chainID]
	);

	/**********************************************************************************************
	 ** The listAllTokensWithBalance is similar to the listTokensWithBalance function, but it will
	 ** return all tokens from all networks. It will be triggered when the allTokens or getBalance
	 ** or balanceHash changes.
	 *********************************************************************************************/
	const listAllTokensWithBalance = useCallback((): TToken[] => {
		acknowledge(balanceHash);
		const withBalance = [];
		for (const eachNetwork of Object.values(allTokens)) {
			for (const dest of Object.values(eachNetwork)) {
				const balance = getBalance({address: dest.address, chainID: dest.chainID});
				// force displaying extra tokens along with other tokens with balance
				if (balance.raw > 0n || isCustomToken({address: dest.address, chainID: dest.chainID})) {
					withBalance.push({...dest, balance});
				}
			}
		}
		return withBalance;
	}, [allTokens, getBalance, isCustomToken, balanceHash]);

	return {
		listAllTokensWithBalance,
		listTokensWithBalance,
		listTokens,
		isLoading,
		isLoadingOnCurrentChain,
		isLoadingOnChain,
		onRefresh
	};
}
