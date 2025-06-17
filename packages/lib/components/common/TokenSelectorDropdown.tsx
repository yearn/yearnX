import {Fragment, type ReactElement, type RefObject, useMemo} from 'react';
import {usePrices} from '@lib/contexts/usePrices';
import {useWeb3} from '@lib/contexts/useWeb3';
import {cl, formatAmount, toAddress, toBigInt, truncateHex} from '@lib/utils';
import {acknowledge} from '@lib/utils/tools';

import {IconSearch} from '../icons/IconSearch';
import {ImageWithFallback} from './ImageWithFallback';

import type {TNormalizedBN, TToken} from '@lib/types';

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

function TokenItem(props: {item: TToken; onSelected: (token: TToken) => void}): ReactElement {
	const {prices, pricingHash} = usePrices();

	/**********************************************************************************************
	 ** The tokenBalance memoized value contains the string representation of the token balance,
	 ** correctly formated. If the balance is dusty, it will display '> 0.000001' instead of '0'.
	 *********************************************************************************************/
	const tokenBalance = useMemo((): string => {
		if (!props.item) {
			return '';
		}
		const formatedBalance = formatAmount(props.item.balance.normalized, 0, 5);
		if (Number(formatedBalance) < 0) {
			return '< 0.000001';
		}
		if (Number(formatedBalance) === 0) {
			return '0.00';
		}
		return formatedBalance;
	}, [props.item]);

	/**********************************************************************************************
	 ** The balanceValue memoized value contains the string representation of the token balance,
	 ** in USD. If the token balance is zero, it will display 'N/A'.
	 *********************************************************************************************/
	const balanceValue = useMemo((): string => {
		acknowledge(pricingHash);
		if (!props.item) {
			return 'N/A';
		}

		const price = prices?.[props.item.chainID]?.[toAddress(props.item.address)];
		if (toBigInt(price?.raw) === 0n) {
			return 'N/A';
		}
		const value = props.item.balance.normalized * (price?.normalized || 0);

		const formatedValue = formatAmount(value, 2);
		return `$${formatedValue}`;
	}, [prices, pricingHash, props.item]);

	return (
		<button
			onClick={() => props.onSelected(props.item)}
			className={'hover:bg-regularText/5 flex w-full items-center justify-between  px-6 py-3.5'}>
			<div className={'flex gap-x-4'}>
				<div className={'flex items-center'}>
					<ImageWithFallback
						src={`https://assets.smold.app/tokens/${props.item.chainID}/${props.item.address}/logo-128.png`}
						alt={props.item.name}
						width={32}
						height={32}
					/>
				</div>
				<div className={'flex flex-col items-start'}>
					<div>{props.item.symbol}</div>
					<div className={'text-regularText/50 text-sm'}>{truncateHex(props.item.address, 5)}</div>
				</div>
			</div>

			<div className={'flex flex-col items-end'}>
				<div>{tokenBalance}</div>
				<div className={'text-regularText/50 text-sm'}>{balanceValue}</div>
			</div>
		</button>
	);
}

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

	/**********************************************************************************************
	 ** Too many tokens, let's only display 25 of them, for more user needs to search.
	 *********************************************************************************************/
	const tokensToDisplay = useMemo(() => tokens.slice(0, 20), [tokens]);

	return (
		<Fragment>
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
							<TokenItem
								key={item.address}
								item={item}
								onSelected={() => {
									set_tokenToUse(item, item.balance);
									set_isOpen(false);
								}}
							/>
						))}
					</div>
				</div>
			)}
		</Fragment>
	);
};
