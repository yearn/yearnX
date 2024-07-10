import {type ReactElement, type RefObject, useCallback, useState} from 'react';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, formatAmount, toBigInt, truncateHex} from '@builtbymom/web3/utils';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {usePrices} from '@lib/contexts/usePrices';
import {useTokensWithBalance} from '@lib/hooks/useTokensWithBalance';

import {IconChevron} from '../icons/IconChevron';
import {IconSearch} from '../icons/IconSearch';
import {ImageWithFallback} from './ImageWithFallback';

import type {TToken} from '@builtbymom/web3/types';
import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';

type TChainSelectorProps = {
	vault: TYDaemonVault;
	isOpen: boolean;
	toggleOpen: VoidFunction;
	selectorRef: RefObject<HTMLDivElement>;
};

export function TokenSelector({vault, isOpen, toggleOpen, selectorRef}: TChainSelectorProps): ReactElement {
	const {listTokensWithBalance} = useTokensWithBalance();
	const {getPrice} = usePrices();
	const {address} = useWeb3();

	const [searchValue, set_searchValue] = useState('');

	const tokensOnCurrentChain = listTokensWithBalance(vault.chainID);

	const searchFilteredTokens = tokensOnCurrentChain.filter(token => {
		const lowercaseValue = searchValue.toLowerCase();
		return token.name.toLowerCase().includes(lowercaseValue) || token.symbol.toLowerCase().includes(lowercaseValue);
	});

	const {configuration, dispatchConfiguration} = useManageVaults();

	/**********************************************************************************************
	 ** The tokenBalance memoized value contains the string representation of the token balance,
	 ** correctly formated. If the balance is dusty, it will display '> 0.000001' instead of '0'.
	 *********************************************************************************************/
	const tokenBalance = useCallback((token: TToken): string => {
		if (!token) {
			return '';
		}
		const formatedBalance = formatAmount(token.balance.normalized, 0, 5);
		if (Number(formatedBalance) < 0) {
			return '< 0.000001';
		}
		if (Number(formatedBalance) === 0) {
			return '0.00';
		}
		return formatedBalance;
	}, []);

	/**********************************************************************************************
	 ** The balanceValue memoized value contains the string representation of the token balance,
	 ** in USD. If the token balance is zero, it will display 'N/A'.
	 *********************************************************************************************/
	const balanceValue = useCallback(
		(token: TToken): string => {
			if (!token) {
				return 'N/A';
			}

			const price = getPrice({chainID: token.chainID, address: token.address});
			if (toBigInt(price?.raw) === 0n) {
				return 'N/A';
			}
			const value = token.balance.normalized * (price?.normalized || 0);

			const formatedValue = formatAmount(value, 2);
			return `$${formatedValue}`;
		},
		[getPrice]
	);

	const {getBalance} = useWallet();

	return (
		<>
			<button
				disabled={!address}
				onClick={toggleOpen}
				className={
					'border-regularText/15 bg-regularText/5 relative flex !h-16 items-center gap-x-1 rounded-lg border px-4 py-3 disabled:cursor-not-allowed'
				}>
				<ImageWithFallback
					src={`https://assets.smold.app/tokens/${vault.chainID}/${configuration?.tokenToSpend.token?.address}/logo-128.png`}
					alt={configuration?.tokenToSpend.token?.address || 'address'}
					width={32}
					height={32}
				/>
				<IconChevron className={'text-regularText size-4'} />
			</button>
			{isOpen && (
				<div
					ref={selectorRef}
					className={
						'bg-table no-scrollbar border-regularText/15 absolute z-[1003] mt-2 rounded-lg border py-5 md:min-w-[507px]'
					}>
					<label
						className={cl(
							'z-20 !h-16 relative transition-all border border-regularText/15',
							'flex flex-row items-center cursor-text',
							'focus:placeholder:text-regularText/40 placeholder:transition-colors',
							'py-2 mb-3 mx-6 pl-0 pr-4 group border-regularText/15 bg-regularText/5 rounded-lg'
						)}>
						<input
							className={cl(
								'w-full relative rounded-lg py-3 px-4 bg-transparent border-none text-base',
								'text-regularText placeholder:text-regularText/40 caret-regularText/60',
								'focus:placeholder:text-regularText/40 placeholder:transition-colors',
								'disabled:cursor-not-allowed disabled:opacity-40'
							)}
							type={'text'}
							placeholder={'0x... or Name'}
							autoComplete={'off'}
							autoCorrect={'off'}
							spellCheck={'false'}
							value={searchValue}
							disabled={!address}
							onChange={e => set_searchValue(e.target.value)}
						/>
						<IconSearch className={'size-5'} />
					</label>

					<div className={'no-scrollbar max-h-[200px] overflow-auto '}>
						{searchFilteredTokens.map(item => (
							<button
								onClick={() => {
									toggleOpen();
									dispatchConfiguration({
										type: 'SET_TOKEN_TO_SPEND',
										payload: {
											token: item,
											amount: getBalance({address: item.address, chainID: item.chainID})
										}
									});
								}}
								className={
									'hover:bg-regularText/5 flex w-full items-center justify-between  px-6 py-3.5'
								}>
								<div className={'flex gap-x-4'}>
									<div className={'flex items-center'}>
										<ImageWithFallback
											src={`https://assets.smold.app/tokens/${item.chainID}/${item.address}/logo-128.png`}
											alt={vault.token.address}
											width={32}
											height={32}
										/>
									</div>
									<div className={'flex flex-col items-start'}>
										<div>{item.symbol}</div>
										<div className={'text-regularText/50 text-sm'}>
											{truncateHex(item.address, 5)}
										</div>
									</div>
								</div>

								<div className={'flex flex-col items-end'}>
									<div>{tokenBalance(item)}</div>
									<div className={'text-regularText/50 text-sm'}>{balanceValue(item)}</div>
								</div>
							</button>
						))}
					</div>
				</div>
			)}
		</>
	);
}
