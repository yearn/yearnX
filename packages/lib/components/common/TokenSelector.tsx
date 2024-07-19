import {type ReactElement, type RefObject, useEffect, useState} from 'react';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {toAddress} from '@builtbymom/web3/utils';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {usePopularTokens} from '@lib/contexts/usePopularTokens';
import {useDeepCompareMemo} from '@react-hookz/web';

import {IconChevron} from '../icons/IconChevron';
import {ImageWithFallback} from './ImageWithFallback';
import {TokenSelectorDropdown} from './TokenSelectorDropdown';

import type {TNormalizedBN, TToken} from '@builtbymom/web3/types';

function getDifference(item: string, searchTerm: string): number {
	if (item.startsWith(searchTerm)) {
		return item.length - searchTerm.length; // Difference is the extra characters beyond the search term
	}
	return item.length + searchTerm.length; // Large difference if not starting with searchTerm
}

type TChainSelectorProps = {
	chainID: number;
	isOpen: boolean;
	toggleOpen: VoidFunction;
	selectorRef: RefObject<HTMLDivElement>;
	selectorButtonRef: RefObject<HTMLButtonElement>;
	set_tokenToUse: (value: TToken, amount: TNormalizedBN) => void;
};

export function TokenSelector({
	chainID,
	isOpen,
	toggleOpen,
	selectorRef,
	selectorButtonRef,
	set_tokenToUse
}: TChainSelectorProps): ReactElement {
	const {listTokens} = usePopularTokens();
	const {address} = useWeb3();
	const [searchValue, set_searchValue] = useState('');
	const {configuration} = useManageVaults();
	const [tokensToUse, set_tokensToUse] = useState<TToken[]>([]);

	useEffect((): void => {
		const allPopularTokens = listTokens(chainID);
		const allPopularTokensWithBalance = allPopularTokens.filter(e => e.balance.raw > 0n);
		set_tokensToUse(allPopularTokensWithBalance);
	}, [chainID, listTokens]);

	/**********************************************************************************************
	 ** Filter tokens on the current chain based on a search value.
	 ** - Filters tokens by checking if their name or symbol includes the lowercase search value.
	 *********************************************************************************************/
	const filteredTokens = useDeepCompareMemo(() => {
		const searchFor = searchValue.toLocaleLowerCase();
		if (searchFor === '') {
			return tokensToUse;
		}
		const filtering = tokensToUse.filter(
			token =>
				token.symbol.toLocaleLowerCase().includes(searchFor) ||
				token.name.toLocaleLowerCase().includes(searchFor) ||
				toAddress(token.address).toLocaleLowerCase().includes(searchFor)
		);

		const sorted = filtering
			.map(item => ({
				item,
				exactness:
					item.name.toLocaleLowerCase() === searchFor || item.symbol.toLocaleLowerCase() === searchFor
						? 1
						: 0,
				diffName: getDifference(item.name.toLocaleLowerCase(), searchFor),
				diffSymbol: getDifference(item.symbol.toLocaleLowerCase(), searchFor)
			}))
			.sort(
				(a, b) =>
					b.exactness - a.exactness || Math.min(a.diffName, a.diffSymbol) - Math.min(b.diffName, b.diffSymbol)
			) // Sort by exactness first, then by the smallest ascending difference of name or symbol
			.map(sortedItem => sortedItem.item); // Return sorted items

		return sorted.slice(0, 20);
	}, [tokensToUse, searchValue]);

	return (
		<>
			<button
				disabled={!address}
				ref={selectorButtonRef}
				onClick={toggleOpen}
				className={
					'border-regularText/15 bg-regularText/5 relative flex !h-16 items-center gap-x-1 rounded-lg border px-4 py-3 disabled:cursor-not-allowed'
				}>
				<ImageWithFallback
					src={`https://assets.smold.app/tokens/${chainID}/${configuration?.tokenToSpend.token?.address}/logo-128.png`}
					alt={configuration?.tokenToSpend.token?.address || 'address'}
					width={32}
					height={32}
				/>
				<IconChevron className={'text-regularText size-5'} />
			</button>
			<TokenSelectorDropdown
				isOpen={isOpen}
				set_isOpen={toggleOpen}
				searchValue={searchValue}
				set_searchValue={set_searchValue}
				tokens={filteredTokens}
				selectorRef={selectorRef}
				set_tokenToUse={set_tokenToUse}
			/>
		</>
	);
}
