import {type ReactElement, useMemo, useRef, useState} from 'react';
import InputNumber from 'rc-input-number';
import {useOnClickOutside} from 'usehooks-ts';
import {zeroAddress} from 'viem';
import {useReadContract} from 'wagmi';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import useWallet from '@lib/contexts/useWallet';
import {useWeb3} from '@lib/contexts/useWeb3';
import {cl, formatAmount, fromNormalized, toBigInt, toNormalizedBN, zeroNormalizedBN} from '@lib/utils';
import {acknowledge, toPercent} from '@lib/utils/tools';
import {VAULT_ABI} from '@lib/utils/vault.abi';

import {Button} from './Button';
import {TokenSelector} from './TokenSelector';

import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';
import type {TNormalizedBN, TToken} from '@lib/types';

type TTokenAmountInputProps = {
	chainID: number;
	isPerformingAction: boolean;
	onChangeValue: (value: TNormalizedBN | undefined, token?: TToken) => void;
	onMaxClick: () => void;
	onActionClick: () => void;
	isButtonDisabled: boolean;
	set_tokenToUse: (token: TToken, amount: TNormalizedBN) => void;
};

export function TokenAmountInput(props: TTokenAmountInputProps): ReactElement {
	const {chainID} = props;
	const {address} = useWeb3();
	const [isChainSelectorOpen, set_isChainSelectorOpen] = useState<boolean>(false);
	const {configuration} = useManageVaults();
	const selectorRef = useRef<HTMLDivElement>(null);
	const selectorButtonRef = useRef<HTMLButtonElement>(null);

	/**********************************************************************************************
	 ** In TokenSelector we add this useOnClickOutside to close token list on outside click.
	 *********************************************************************************************/
	useOnClickOutside<HTMLDivElement | HTMLButtonElement>([selectorRef, selectorButtonRef], () =>
		set_isChainSelectorOpen(false)
	);

	return (
		<div className={'flex w-full gap-x-2'}>
			<div className={'h-full'}>
				<TokenSelector
					chainID={chainID}
					isOpen={isChainSelectorOpen}
					toggleOpen={() => set_isChainSelectorOpen(prev => !prev)}
					selectorRef={selectorRef}
					selectorButtonRef={selectorButtonRef}
					set_tokenToUse={props.set_tokenToUse}
				/>
			</div>
			<label
				className={cl(
					'z-20 !h-16 w-full relative transition-all border border-regularText/15',
					'flex flex-row items-center cursor-text',
					'focus:placeholder:text-regularText/40 placeholder:transition-colors',
					'py-2 pl-0 pr-4 group border-regularText/15 bg-regularText/5 rounded-lg'
				)}>
				<div className={'relative w-full pr-2'}>
					<InputNumber
						prefixCls={cl(
							'w-full h-full focus:border-none rounded-lg border-none bg-transparent text-xl transition-colors',
							'placeholder:text-regularText/20 focus:placeholder:text-regularText/30',
							'placeholder:transition-colors !h-16 !ring-0 !ring-offset-0'
						)}
						min={0}
						step={0.1}
						decimalSeparator={'.'}
						placeholder={'0.00'}
						controls={false}
						value={configuration?.tokenToSpend.amount?.normalized}
						onChange={value => {
							if (!value || !configuration.tokenToSpend.token) {
								return props.onChangeValue(undefined);
							}
							const {decimals} = configuration.tokenToSpend.token;
							props.onChangeValue(toNormalizedBN(fromNormalized(value, decimals), decimals));
						}}
					/>
				</div>
				<button
					onClick={props.onMaxClick}
					disabled={!address}
					className={
						'border-regularText/15 bg-regularText/5 text-regularText rounded-lg border p-2 disabled:cursor-not-allowed'
					}>
					{'Max'}
				</button>
			</label>
		</div>
	);
}

type TTokenAmountWrapperProps = {
	vault: TYDaemonVault;
	isPerformingAction: boolean;
	onActionClick: () => void;
	isDisabled: boolean;
	buttonTitle: string;
	set_tokenToUse: (token: TToken, amount: TNormalizedBN) => void;
	totalProfit?: string;
	apy: number;
};
export function TokenAmountWrapper(props: TTokenAmountWrapperProps): ReactElement {
	const {balanceHash, getBalance} = useWallet();
	const {address, onConnect} = useWeb3();
	const {configuration, dispatchConfiguration} = useManageVaults();

	/**********************************************************************************************
	 ** Retrieve the price per share for the current vault.
	 *********************************************************************************************/
	const {data: vaultPricePerShare} = useReadContract({
		abi: VAULT_ABI,
		address: props.vault.address,
		functionName: 'pricePerShare',
		chainId: props.vault.chainID
	});

	/**********************************************************************************************
	 ** Retrieve the user's balance for the current vault. We will use the getBalance function
	 ** from the useWallet hook to retrieve the balance. We are using balanceHash as a
	 ** dependency to trigger the useEffect hook when the balances object changes.
	 *********************************************************************************************/
	const balanceOfAsset = useMemo(() => {
		acknowledge(balanceHash);
		const value = getBalance({
			address: configuration?.tokenToSpend.token?.address || zeroAddress,
			chainID: props.vault.chainID
		});
		return value;
	}, [getBalance, configuration?.tokenToSpend, props.vault.chainID, balanceHash]);

	/**********************************************************************************************
	 ** BalanceInShares converts the asset balance to the balance in shares. We use it when the
	 ** users want to withdraw their vault shares to know how many underlying assets they will get
	 ** and display this to the user instead of hard to understand shares.
	 *********************************************************************************************/
	const balanceInShares = useMemo(() => {
		acknowledge(balanceHash);
		const value = getBalance({
			address: configuration?.tokenToSpend.token?.address || zeroAddress,
			chainID: props.vault.chainID
		});
		const pps = vaultPricePerShare;
		return toNormalizedBN(value.raw * toBigInt(pps), props.vault.decimals * 2);
	}, [
		balanceHash,
		getBalance,
		configuration?.tokenToSpend.token?.address,
		props.vault.chainID,
		props.vault.decimals,
		vaultPricePerShare
	]);

	/**********************************************************************************************
	 ** BalanceToUse is the balance that we will use to display to the user. If the user is
	 ** depositing into the vault, we will use the balance of the asset. If the user is withdrawing
	 ** from the vault, we will use the balance in shares.
	 *********************************************************************************************/
	const balanceToUse = useMemo(() => {
		if (configuration?.tokenToSpend.token?.address === props.vault.address) {
			return balanceInShares;
		}
		return balanceOfAsset;
	}, [configuration?.tokenToSpend.token?.address, props.vault.address, balanceOfAsset, balanceInShares]);

	/**********************************************************************************************
	 ** AssetName is the name of the asset that we will display to the user. If the user is
	 ** depositing into the vault, we will use the vault token symbol. If the user is withdrawing
	 ** from the vault, we will use the asset symbol.
	 *********************************************************************************************/
	const assetName = useMemo(() => {
		if (configuration?.tokenToSpend.token?.address === props.vault.address) {
			return props.vault.token.symbol;
		}
		return configuration?.tokenToSpend.token?.symbol;
	}, [
		configuration?.tokenToSpend.token?.address,
		configuration?.tokenToSpend.token?.symbol,
		props.vault.address,
		props.vault.token.symbol
	]);

	/**********************************************************************************************
	 ** If there's no amount or it equals to 0 we don't want user to be able to click the button.
	 ** Also if user doesn't have enough money on his balance we just disable the button as well.
	 *********************************************************************************************/
	const isButtonDisabled =
		!configuration?.tokenToSpend.amount ||
		configuration?.tokenToSpend.amount.raw === 0n ||
		(configuration?.tokenToSpend.amount &&
			configuration?.tokenToSpend.amount?.normalized > balanceToUse.normalized) ||
		props.isDisabled ||
		balanceToUse.normalized < configuration?.tokenToSpend.amount.normalized;

	return (
		<div className={'flex w-full flex-col items-start gap-y-2'}>
			<div className={'flex w-full flex-col gap-y-1'}>
				<TokenAmountInput
					chainID={props.vault.chainID}
					isPerformingAction={props.isPerformingAction}
					onChangeValue={(val?: TNormalizedBN) => {
						dispatchConfiguration({
							type: 'SET_TOKEN_TO_SPEND',
							payload: {amount: val ?? zeroNormalizedBN}
						});
					}}
					onMaxClick={() =>
						dispatchConfiguration({type: 'SET_TOKEN_TO_SPEND', payload: {amount: balanceToUse}})
					}
					onActionClick={props.onActionClick}
					isButtonDisabled={isButtonDisabled}
					set_tokenToUse={props.set_tokenToUse}
				/>
			</div>
			<button
				onClick={() => dispatchConfiguration({type: 'SET_TOKEN_TO_SPEND', payload: {amount: balanceToUse}})}
				className={'text-regularText text-right text-xs text-opacity-40'}>
				{`Available: ${formatAmount(balanceToUse.normalized)} ${assetName}`}
			</button>

			<div className={'my-10 flex w-full justify-between'}>
				<div>
					<span className={'mr-1'}>{'APY:'}</span>
					<span className={'font-bold'}>{toPercent(props.apy)}</span>
				</div>
				{Boolean(configuration?.tokenToSpend.amount?.normalized) && (
					<span className={'text-base'}>
						{'+ '}
						{props.totalProfit}
						{' over 1y'}
					</span>
				)}
			</div>
			<Button
				onClick={address ? props.onActionClick : onConnect}
				isBusy={props.isPerformingAction}
				isDisabled={!address ? false : isButtonDisabled}
				spinnerClassName={'text-black size-6 animate-spin'}
				className={cl(
					'text-black flex w-full justify-center regularTextspace-nowrap rounded-lg bg-regularText md:px-[34.5px] py-5 font-bold',
					'disabled:bg-regularText/10 disabled:text-regularText/30 disabled:cursor-not-allowed !h-12'
				)}>
				{props.buttonTitle}
			</Button>
		</div>
	);
}
