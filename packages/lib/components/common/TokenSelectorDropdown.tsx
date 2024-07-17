import {type ReactElement, type RefObject, useCallback, useMemo} from 'react';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, formatAmount, toBigInt, truncateHex} from '@builtbymom/web3/utils';
import {usePrices} from '@lib/contexts/usePrices';

import {IconSearch} from '../icons/IconSearch';
import {ImageWithFallback} from './ImageWithFallback';

import type {TNormalizedBN, TToken} from '@builtbymom/web3/types';

type TTokenSelectorDropdownProps = {
	isOpen: boolean;
	searchValue: string;
	set_isOpen: (value: boolean) => void;
	set_tokenToUse: (value: TToken, amount: TNormalizedBN) => void;
	set_searchValue: (value: string) => void;
	tokens: TToken[];
	className?: string;
	selectorRef: RefObject<HTMLDivElement>;
};

export const TokenSelectorDropdown = ({
	set_isOpen,
	isOpen,
	set_tokenToUse,
	searchValue,
	set_searchValue,
	tokens,
	className,
	selectorRef
}: TTokenSelectorDropdownProps): ReactElement => {
	const {address} = useWeb3();
	const {getPrice} = usePrices();

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

	/**********************************************************************************************
	 ** Too many tokens, let's only display 25 of them, for more user needs to search.
	 *********************************************************************************************/
	const tokensToDisplay = useMemo(() => tokens.slice(0, 25), [tokens]);

	return (
		<>
			{isOpen && (
				<div
					ref={selectorRef}
					className={cl(
						'w-fit min-w-[341px] md:min-w-[560px]',
						'bg-table no-scrollbar border-regularText/15 absolute z-[1003] mt-2 rounded-lg border py-5',
						className
					)}>
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
						{tokensToDisplay.map(item => (
							<button
								key={item.address}
								onClick={() => {
									set_tokenToUse(item, item.balance);
									set_isOpen(false);
								}}
								className={
									'hover:bg-regularText/5 flex w-full items-center justify-between  px-6 py-3.5'
								}>
								<div className={'flex gap-x-4'}>
									<div className={'flex items-center'}>
										<ImageWithFallback
											src={`https://assets.smold.app/tokens/${item.chainID}/${item.address}/logo-128.png`}
											alt={item.name}
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
};
