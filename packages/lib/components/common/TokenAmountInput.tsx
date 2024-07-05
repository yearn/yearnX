import {type ReactElement, useMemo, useState} from 'react';
import InputNumber from 'rc-input-number';
import {serialize, useReadContract} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, formatAmount, fromNormalized, toBigInt, toNormalizedBN} from '@builtbymom/web3/utils';
import {createUniqueID} from '@lib/utils/tools.identifiers';
import {VAULT_ABI} from '@lib/utils/vault.abi';

import {Button} from './Button';
import {ChainSelector} from './ChainSelector';

import type {TNormalizedBN, TToken} from '@builtbymom/web3/types';
import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';

type TTokenAmountInputProps = {
	label: string;
	vault: TYDaemonVault;
	value: TNormalizedBN | undefined;
	isPerformingAction: boolean;
	onChangeValue: (value: TNormalizedBN | undefined) => void;
	onMaxClick: () => void;
	onActionClick: () => void;
	set_assetToUse: (token: TToken) => void;
	assetToUse: TToken;
};

function TokenAmountInput(props: TTokenAmountInputProps): ReactElement {
	const {label, vault, set_assetToUse, assetToUse} = props;
	const {address, onConnect} = useWeb3();

	const [isChainSelectorOpen, set_isChainSelectorOpen] = useState<boolean>(false);

	return (
		<div className={'flex w-full gap-x-2'}>
			<div className={'h-full'}>
				<ChainSelector
					vault={vault}
					isOpen={isChainSelectorOpen}
					toggleOpen={() => set_isChainSelectorOpen(prev => !prev)}
					set_assetToUse={set_assetToUse}
					assetToUse={assetToUse}
				/>
			</div>
			<label
				className={cl(
					'z-20 !h-16 relative transition-all border border-white/15',
					'flex flex-row items-center cursor-text',
					'focus:placeholder:text-neutral-300 placeholder:transition-colors',
					'py-2 pl-0 pr-4 group border-white/15 bg-white/5 rounded-lg'
				)}>
				<div className={'relative w-full pr-2'}>
					<InputNumber
						prefixCls={cl(
							'w-full h-full focus:border-none rounded-lg border-none bg-transparent text-xl transition-colors',
							'placeholder:text-white/20 focus:placeholder:text-white/30',
							'placeholder:transition-colors !h-16 !ring-0 !ring-offset-0'
						)}
						min={0}
						step={0.1}
						decimalSeparator={'.'}
						placeholder={'0.00'}
						controls={false}
						value={props.value?.normalized}
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
						'rounded-lg border border-white/15 bg-white/5 p-2 text-white disabled:cursor-not-allowed'
					}>
					{'Max'}
				</button>
			</label>

			<div className={'hidden w-[120px] md:flex'}>
				<Button
					onClick={address ? props.onActionClick : onConnect}
					isBusy={props.isPerformingAction}
					isDisabled={(!props.value || props.value.raw === 0n) && !!address}
					className={cl(
						'text-background flex w-full justify-center whitespace-nowrap rounded-lg bg-white px-[34.5px] py-5 font-bold',
						'disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed',
						!address ? '!w-32 !h-full' : '!h-full'
					)}>
					{address ? label : 'Connect wallet'}
				</Button>
			</div>
		</div>
	);
}

type TTokenAmountWrapperProps = {
	label: string;
	assetToUse: TToken;
	vault: TYDaemonVault;
	value: TNormalizedBN | undefined;
	isPerformingAction: boolean;
	onChangeValue: (value: TNormalizedBN | undefined) => void;
	onActionClick: () => void;
	set_assetToUse: (token: TToken) => void;
};
export function TokenAmountWrapper({
	label,
	vault,
	assetToUse,
	value,
	isPerformingAction,
	onChangeValue,
	onActionClick,
	set_assetToUse
}: TTokenAmountWrapperProps): ReactElement {
	const {balances, getBalance} = useWallet();
	const {address, onConnect} = useWeb3();

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
		const value = getBalance({address: assetToUse.address, chainID: vault.chainID});
		return value;
	}, [getBalance, assetToUse, vault.chainID, currentBalanceIdentifier]);

	/**********************************************************************************************
	 ** BalanceInShares converts the asset balance to the balance in shares. We use it when the
	 ** users want to withdraw their vault shares to know how many underlying assets they will get
	 ** and display this to the user instead of hard to understand shares.
	 *********************************************************************************************/
	const balanceInShares = useMemo(() => {
		currentBalanceIdentifier;
		const value = getBalance({address: assetToUse.address, chainID: vault.chainID});
		const pps = vaultPricePerShare;
		return toNormalizedBN(value.raw * toBigInt(pps), vault.decimals * 2);
	}, [currentBalanceIdentifier, getBalance, assetToUse.address, vault.chainID, vaultPricePerShare, vault.decimals]);

	/**********************************************************************************************
	 ** BalanceToUse is the balance that we will use to display to the user. If the user is
	 ** depositing into the vault, we will use the balance of the asset. If the user is withdrawing
	 ** from the vault, we will use the balance in shares.
	 *********************************************************************************************/
	const balanceToUse = useMemo(() => {
		if (assetToUse.address === vault.address) {
			return balanceInShares;
		}
		return balanceOfAsset;
	}, [assetToUse.address, vault.address, balanceOfAsset, balanceInShares]);

	/**********************************************************************************************
	 ** AssetName is the name of the asset that we will display to the user. If the user is
	 ** depositing into the vault, we will use the vault token symbol. If the user is withdrawing
	 ** from the vault, we will use the asset symbol.
	 *********************************************************************************************/
	const assetName = useMemo(() => {
		if (assetToUse.address === vault.address) {
			return vault.token.symbol;
		}
		return assetToUse.symbol;
	}, [assetToUse.address, assetToUse.symbol, vault.address, vault.token.symbol]);

	return (
		<div className={'flex w-full flex-col items-start gap-y-2'}>
			<div className={'flex flex-col gap-y-1'}>
				<p className={'w-min'}>{label}</p>
				<TokenAmountInput
					vault={vault}
					label={label}
					value={value}
					isPerformingAction={isPerformingAction}
					onChangeValue={onChangeValue}
					onMaxClick={() => onChangeValue(balanceToUse)}
					onActionClick={onActionClick}
					set_assetToUse={set_assetToUse}
					assetToUse={assetToUse}
				/>
			</div>
			<button
				onClick={() => onChangeValue(balanceToUse)}
				className={'text-neutral-0 text-right text-xs text-opacity-40'}>
				{`Available: ${formatAmount(balanceToUse.normalized)} ${assetName}`}
			</button>
			<Button
				onClick={address ? onActionClick : onConnect}
				isBusy={isPerformingAction}
				isDisabled={(!value || value.raw === 0n) && !!address}
				className={cl(
					'md:hidden text-background flex w-full justify-center whitespace-nowrap rounded-lg bg-white py-5 font-bold',
					'disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed',
					!address ? '!w-32 !h-full' : '!h-full'
				)}>
				{address ? label : 'Connect wallet'}
			</Button>
		</div>
	);
}
