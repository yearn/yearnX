import {type ReactElement, type RefObject, useState} from 'react';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {useTokensWithBalance} from '@lib/hooks/useTokensWithBalance';

import {IconChevron} from '../icons/IconChevron';
import {ImageWithFallback} from './ImageWithFallback';
import {TokenSelectorDropdown} from './TokenSelectorDropdown';

import type {TNormalizedBN, TToken} from '@builtbymom/web3/types';

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
	const {listTokensWithBalance} = useTokensWithBalance();
	const tokensOnCurrentChain = listTokensWithBalance(chainID);
	const {address} = useWeb3();
	const [searchValue, set_searchValue] = useState('');
	const {configuration} = useManageVaults();

	/**********************************************************************************************
	 ** Filter tokens on the current chain based on a search value.
	 ** - Filters tokens by checking if their name or symbol includes the lowercase search value.
	 *********************************************************************************************/
	const searchFilteredTokens = tokensOnCurrentChain.filter(token => {
		const lowercaseValue = searchValue.toLowerCase();
		return token.name.toLowerCase().includes(lowercaseValue) || token.symbol.toLowerCase().includes(lowercaseValue);
	});

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
				tokens={searchFilteredTokens}
				selectorRef={selectorRef}
				set_tokenToUse={set_tokenToUse}
			/>
		</>
	);
}
