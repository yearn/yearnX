import {type ReactElement, useMemo, useRef, useState} from 'react';
import InputNumber from 'rc-input-number';
import {useOnClickOutside} from 'usehooks-ts';
import {zeroAddress} from 'viem';
import {serialize, useReadContract} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, formatAmount, fromNormalized, toBigInt, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {createUniqueID} from '@lib/utils/tools.identifiers';
import {VAULT_ABI} from '@lib/utils/vault.abi';

import {Button} from './Button';
import {TokenSelector} from './TokenSelector';

import type {TNormalizedBN, TToken} from '@builtbymom/web3/types';
import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';

type TTokenAmountInputProps = {
	buttonTitle: string;
	vault: TYDaemonVault;
	isPerformingAction: boolean;
	onChangeValue: (value: TNormalizedBN | undefined, token?: TToken) => void;
	onMaxClick: () => void;
	onActionClick: () => void;
	isButtonDisabled: boolean;
};

function TokenAmountInput(props: TTokenAmountInputProps): ReactElement {
	const {buttonTitle, vault} = props;
	const {address, onConnect} = useWeb3();
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
					vault={vault}
					isOpen={isChainSelectorOpen}
					toggleOpen={() => set_isChainSelectorOpen(prev => !prev)}
					selectorRef={selectorRef}
					selectorButtonRef={selectorButtonRef}
				/>
			</div>
			<label
				className={cl(
					'z-20 !h-16 relative transition-all border border-regularText/15',
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
							if (!value) {
								return props.onChangeValue(undefined);
							}
							props.onChangeValue(toNormalizedBN(fromNormalized(value, vault.decimals), vault.decimals));
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

			<div className={'hidden w-[120px] md:flex'}>
				<Button
					onClick={address ? props.onActionClick : onConnect}
					isBusy={props.isPerformingAction}
					isDisabled={props.isButtonDisabled}
					className={cl(
						'text-background flex w-full justify-center regularTextspace-nowrap rounded-lg bg-regularText px-[34.5px] py-5 font-bold',
						'disabled:bg-regularText/10 disabled:text-regularText/30 disabled:cursor-not-allowed',
						!address ? '!w-32 !h-full' : '!h-full'
					)}>
					{buttonTitle}
				</Button>
			</div>
		</div>
	);
}

type TTokenAmountWrapperProps = {
	label: string;
	vault: TYDaemonVault;
	isPerformingAction: boolean;
	onActionClick: () => void;
	isDisabled: boolean;
	buttonTitle: string;
};
export function TokenAmountWrapper({
	label,
	vault,
	isPerformingAction,
	onActionClick,
	isDisabled,
	buttonTitle
}: TTokenAmountWrapperProps): ReactElement {
	const {balances, getBalance} = useWallet();
	const {address, onConnect} = useWeb3();

	const {configuration, dispatchConfiguration} = useManageVaults();

	/**********************************************************************************************
	 ** Retrieve the price per share for the current vault.
	 *********************************************************************************************/
	const {data: vaultPricePerShare} = useReadContract({
		abi: VAULT_ABI,
		address: vault.address,
		functionName: 'pricePerShare',
		chainId: vault.chainID
	});

	/**********************************************************************************************
	 ** Balances is an object with multiple level of depth. We want to create a unique hash from
	 ** it to know when it changes. This new hash will be used to trigger the useEffect hook.
	 ** We will use classic hash function to create a hash from the balances object.
	 *********************************************************************************************/
	const currentBalanceIdentifier = useMemo(() => {
		const hash = createUniqueID(serialize(balances));
		return hash;
	}, [balances]);

	/**********************************************************************************************
	 ** Retrieve the user's balance for the current vault. We will use the getBalance function
	 ** from the useWallet hook to retrieve the balance. We are using currentBalanceIdentifier as a
	 ** dependency to trigger the useEffect hook when the balances object changes.
	 *********************************************************************************************/
	const balanceOfAsset = useMemo(() => {
		currentBalanceIdentifier;
		const value = getBalance({
			address: configuration?.tokenToSpend.token?.address || zeroAddress,
			chainID: vault.chainID
		});
		return value;
	}, [getBalance, configuration?.tokenToSpend, vault.chainID, currentBalanceIdentifier]);

	/**********************************************************************************************
	 ** BalanceInShares converts the asset balance to the balance in shares. We use it when the
	 ** users want to withdraw their vault shares to know how many underlying assets they will get
	 ** and display this to the user instead of hard to understand shares.
	 *********************************************************************************************/
	const balanceInShares = useMemo(() => {
		currentBalanceIdentifier;
		const value = getBalance({
			address: configuration?.tokenToSpend.token?.address || zeroAddress,
			chainID: vault.chainID
		});
		const pps = vaultPricePerShare;
		return toNormalizedBN(value.raw * toBigInt(pps), vault.decimals * 2);
	}, [
		currentBalanceIdentifier,
		getBalance,
		configuration?.tokenToSpend.token?.address,
		vault.chainID,
		vault.decimals,
		vaultPricePerShare
	]);

	/**********************************************************************************************
	 ** BalanceToUse is the balance that we will use to display to the user. If the user is
	 ** depositing into the vault, we will use the balance of the asset. If the user is withdrawing
	 ** from the vault, we will use the balance in shares.
	 *********************************************************************************************/
	const balanceToUse = useMemo(() => {
		if (configuration?.tokenToSpend.token?.address === vault.address) {
			return balanceInShares;
		}
		return balanceOfAsset;
	}, [configuration?.tokenToSpend.token?.address, vault.address, balanceOfAsset, balanceInShares]);

	/**********************************************************************************************
	 ** AssetName is the name of the asset that we will display to the user. If the user is
	 ** depositing into the vault, we will use the vault token symbol. If the user is withdrawing
	 ** from the vault, we will use the asset symbol.
	 *********************************************************************************************/
	const assetName = useMemo(() => {
		if (configuration?.tokenToSpend.token?.address === vault.address) {
			return vault.token.symbol;
		}
		return configuration?.tokenToSpend.token?.symbol;
	}, [
		configuration?.tokenToSpend.token?.address,
		configuration?.tokenToSpend.token?.symbol,
		vault.address,
		vault.token.symbol
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
		isDisabled;

	return (
		<div className={'flex w-full flex-col items-start gap-y-2'}>
			<div className={'flex flex-col gap-y-1'}>
				<p className={'w-min'}>{label}</p>
				<TokenAmountInput
					vault={vault}
					buttonTitle={buttonTitle}
					isPerformingAction={isPerformingAction}
					onChangeValue={(val?: TNormalizedBN) => {
						dispatchConfiguration({
							type: 'SET_TOKEN_TO_SPEND',
							payload: {amount: val ?? zeroNormalizedBN}
						});
					}}
					onMaxClick={() =>
						dispatchConfiguration({type: 'SET_TOKEN_TO_SPEND', payload: {amount: balanceToUse}})
					}
					onActionClick={onActionClick}
					isButtonDisabled={isButtonDisabled}
				/>
			</div>
			<button
				onClick={() => dispatchConfiguration({type: 'SET_TOKEN_TO_SPEND', payload: {amount: balanceToUse}})}
				className={'text-regularText text-right text-xs text-opacity-40'}>
				{`Available: ${formatAmount(balanceToUse.normalized)} ${assetName}`}
			</button>
			<Button
				onClick={address ? onActionClick : onConnect}
				isBusy={isPerformingAction}
				isDisabled={isButtonDisabled}
				className={cl(
					'md:hidden text-background flex w-full justify-center regularTextspace-nowrap rounded-lg bg-regularText py-5 font-bold',
					'disabled:bg-regularText/10 disabled:text-regularText/30 disabled:cursor-not-allowed',
					!address ? '!w-32 !h-full' : '!h-full'
				)}>
				{buttonTitle}
			</Button>
		</div>
	);
}
