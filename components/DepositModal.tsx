import React, {Fragment, useCallback, useMemo, useState} from 'react';
import InputNumber from 'rc-input-number';
import {erc20Abi} from 'viem';
import {useReadContracts} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {
	cl,
	decodeAsBigInt,
	formatAmount,
	fromNormalized,
	isZeroAddress,
	toAddress,
	toBigInt,
	toNormalizedBN
} from '@builtbymom/web3/utils';
import {approveERC20, defaultTxStatus, getNetwork} from '@builtbymom/web3/utils/wagmi';
import {calculateUnionProbability, SECONDS_PER_WEEK} from '@generationsoftware/hyperstructure-client-js';
import {useDrawPeriod, usePrizeOdds} from '@generationsoftware/hyperstructure-react-hooks';
import {Dialog, Transition} from '@headlessui/react';
import {depositERC20} from '@utils/actions';
import {PRIZE_VAULT_ABI} from '@utils/prizeVault.abi';
import {Button} from '@common/Button';
import {ImageWithFallback} from '@common/ImageWithFallback';

import type {ReactElement} from 'react';
import type {PrizePool, TokenWithSupply, Vault} from '@generationsoftware/hyperstructure-client-js';
import type {TVaultData} from '@utils/types';

type TDepositPopupProps = {
	prizePool: PrizePool;
	vault: Vault;
	vaultData: TVaultData;
	isOpen: boolean;
	onClose: () => void;
};

/**************************************************************************************************
 ** The DepositPopup component is a popup that shows when the user clicks on the Deposit button
 ** on the Vault component. It shows the user a form where they can input the amount of the asset
 ** they want to deposit into the vault. It also shows the user the amount of shares they will
 ** receive for the amount they want to deposit.
 *************************************************************************************************/
function DepositPopup(props: TDepositPopupProps): ReactElement {
	const {address, provider} = useWeb3();
	const [shareData, set_shareData] = useState<TokenWithSupply | undefined>(undefined);
	const [value, set_value] = useState<number | undefined>(undefined);
	const [isTyping, set_isTyping] = useState(false);
	const [approvalStatus, set_approvalStatus] = useState(defaultTxStatus);
	const [depositStatus, set_depositStatus] = useState(defaultTxStatus);
	const {data: drawPeriod} = useDrawPeriod(props.prizePool);
	const {data: odds} = usePrizeOdds(
		props.prizePool,
		props.vault,
		fromNormalized(value || 0, props.vaultData.decimals),
		{
			isCumulative: true
		}
	);

	/**********************************************************************************************
	 ** Calculate the weekly chance of winning the prize pool. We need to calculate the weekly
	 ** chance of winning the prize pool in order to display it to the user. We need to know the
	 ** odds of winning the prize pool and the draw period of the prize pool in order to calculate
	 ** the weekly chance of winning the prize pool.
	 *********************************************************************************************/
	const weeklyChance = useMemo((): string => {
		if (!odds) {
			return '';
		}
		if (!value || value === 0) {
			return '';
		}
		if (!!odds && !!drawPeriod) {
			const drawsPerWeek = SECONDS_PER_WEEK / drawPeriod;
			const events = Array<number>(drawsPerWeek).fill(odds.percent);
			const value = 1 / calculateUnionProbability(events);
			if (value < 1) {
				return formatAmount(value, 4);
			}
			if (value < 10) {
				return formatAmount(value, 2);
			}
			return formatAmount(value, 0, 0);
		}
		return '';
	}, [odds, value, drawPeriod]);

	/**********************************************************************************************
	 ** For display purpose, we need to fetch the balance of the user in the vault and the balance
	 ** of the user in the asset.
	 ** We grab the allowance of the user for the vault in order to check if the user has enough
	 ** balance to deposit the amount they want to deposit.
	 ** We also need to fetch the price per share of the vault in order
	 ** to calculate the amount of shares the user will receive for the amount they want to
	 ** deposit.
	 *********************************************************************************************/
	const {data, refetch} = useReadContracts({
		contracts: [
			{
				abi: erc20Abi,
				address: props.vaultData.assetAddress,
				functionName: 'balanceOf',
				chainId: 10,
				args: [toAddress(address)]
			},
			{
				abi: erc20Abi,
				address: props.vaultData.address,
				functionName: 'balanceOf',
				chainId: 10,
				args: [toAddress(address)]
			},
			{
				abi: erc20Abi,
				address: props.vaultData.assetAddress,
				functionName: 'allowance',
				chainId: 10,
				args: [toAddress(address), props.vaultData.address]
			},
			{
				abi: PRIZE_VAULT_ABI,
				address: props.vaultData.address,
				functionName: 'convertToShares',
				chainId: 10,
				args: [toBigInt(10 ** props.vaultData.decimals)]
			}
		],
		query: {
			enabled: !isZeroAddress(address),
			select(data) {
				return {
					underlyingBalanceOf: toNormalizedBN(decodeAsBigInt(data[0]), props.vaultData.decimals),
					vaultBalanceOf: toNormalizedBN(decodeAsBigInt(data[1]), props.vaultData.decimals),
					allowance: toNormalizedBN(decodeAsBigInt(data[2]), props.vaultData.decimals),
					pricePerShare: toNormalizedBN(decodeAsBigInt(data[3]), props.vaultData.decimals).normalized
				};
			}
		}
	});

	/**********************************************************************************************
	 ** By default, the shareData is undefined as long as we didn't fetch it. So we need to make
	 ** sure we fetch it before we can use it. This is where the useAsyncTrigger hook comes in.
	 *********************************************************************************************/
	useAsyncTrigger(async () => {
		const shareData = await props.vault.getShareData();
		set_shareData(shareData);
	}, [props.vault]);

	/**********************************************************************************************
	 ** Format the share value for display to kinda-mimic the behavior of the input number
	 *********************************************************************************************/
	const shareForValue = useMemo(() => {
		if (!value) {
			return '0.00';
		}
		const _value = (value || 0) / (data?.pricePerShare || 1);
		if (isTyping) {
			return _value;
		}
		return Math.round(_value) === _value ? `${_value}.0` : _value;
	}, [value, data?.pricePerShare, isTyping]);

	/**********************************************************************************************
	 ** The onApproveOrDeposit function is called when the user clicks on the Deposit button. It
	 ** checks if the user has enough allowance to deposit the amount they want to deposit. If they
	 ** don't, it calls the approveERC20 function to approve the vault to spend the amount the user
	 ** wants to deposit. If the user has enough allowance, it calls the depositERC20 function to
	 ** deposit the amount the user wants to deposit.
	 *********************************************************************************************/
	const onApproveOrDeposit = useCallback(async () => {
		const hasAllowance = toBigInt(data?.allowance.raw) >= fromNormalized(value || 0, props.vaultData.decimals);
		if (!hasAllowance) {
			const result = await approveERC20({
				connector: provider,
				chainID: 10,
				contractAddress: toAddress(props.vaultData.assetAddress),
				spenderAddress: toAddress(props.vaultData.address),
				amount: fromNormalized(value || 0, props.vaultData.decimals),
				statusHandler: set_approvalStatus
			});
			if (result.isSuccessful) {
				await refetch();
			}
			return;
		}

		const result = await depositERC20({
			connector: provider,
			chainID: 10,
			contractAddress: toAddress(props.vaultData.address),
			amount: fromNormalized(value || 0, props.vaultData.decimals),
			statusHandler: set_depositStatus
		});
		if (result.isSuccessful) {
			await refetch();
			set_value(undefined);
			props.onClose();
		}
	}, [data?.allowance.raw, value, props, provider, refetch]);

	return (
		<Transition.Child
			as={Fragment}
			enter={'ease-out duration-300'}
			enterFrom={'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'}
			enterTo={'opacity-100 translate-y-0 sm:scale-100'}
			leave={'ease-in duration-200'}
			leaveFrom={'opacity-100 translate-y-0 sm:scale-100'}
			leaveTo={'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'}>
			<Dialog.Panel
				className={cl(
					'relative overflow-hidden flex flex-col items-center justify-center rounded-md bg-purple py-10 px-6 transition-all',
					'sm:my-8 sm:w-full sm:max-w-xl font-sans'
				)}>
				<div className={'absolute right-5 top-3'}>
					<button
						onClick={props.onClose}
						className={'text-white hover:text-white'}>
						{'⛌'}
					</button>
				</div>
				<Dialog.Title
					as={'h3'}
					className={'font-sans text-lg font-bold leading-6 text-white'}>
					{`Deposit into ${props.vaultData.name}`}
				</Dialog.Title>

				<div className={'py-4'}>
					<div
						className={
							'mx-auto flex w-fit items-center justify-center gap-2 rounded-lg bg-white/20 px-2 py-1 text-center text-sm'
						}>
						<ImageWithFallback
							src={'https://assets.smold.app/chains/10/logo-32.png'}
							alt={getNetwork(10).name}
							width={16}
							height={16}
						/>
						<p>{`${getNetwork(10).name} Prize Pool`}</p>
					</div>
				</div>

				<div className={'grid w-full gap-1'}>
					<label
						className={cl(
							'h-20 z-20 relative transition-all',
							'flex flex-row items-center cursor-text',
							'focus:placeholder:text-neutral-300 placeholder:transition-colors',
							'p-2 px-4 group bg-white/10 rounded-lg'
						)}>
						<div className={'relative w-full pr-2'}>
							<InputNumber
								prefixCls={cl(
									'w-full border-none bg-transparent p-0 text-xl transition-colors',
									'text-white placeholder:text-white/20 focus:placeholder:text-white/30',
									'placeholder:transition-colors overflow-hidden'
								)}
								min={0}
								step={0.1}
								value={value}
								decimalSeparator={'.'}
								placeholder={'0.00'}
								onChange={value => {
									set_isTyping(true);
									set_value(value || undefined);
								}}
								onBlur={() => set_isTyping(false)}
							/>
						</div>
						<div className={'w-auto text-right'}>
							<div className={'flex h-8 items-center justify-end gap-2 text-right'}>
								<ImageWithFallback
									style={{width: 32, height: 32, minWidth: 32, minHeight: 32}}
									src={`https://assets.smold.app/tokens/10/${props.vaultData.assetAddress}/logo-128.png`}
									alt={props.vaultData.assetSymbol}
									width={128}
									height={128}
								/>
								<b className={'whitespace-nowrap text-lg'}>{props.vaultData.assetSymbol}</b>
							</div>
							<p className={'mt-1 whitespace-nowrap text-xs text-white/60'}>
								{`Balance: ${formatAmount(data?.underlyingBalanceOf?.normalized || 0, 4)}`}
							</p>
						</div>
					</label>

					<div
						className={cl(
							'h-20 z-20 relative transition-all',
							'flex flex-row items-center cursor-text',
							'focus:placeholder:text-neutral-300 placeholder:transition-colors',
							'p-2 px-4 group bg-white/10 rounded-lg'
						)}>
						<div className={'w-full pr-2'}>
							<div
								className={cl(
									'w-full border-none bg-transparent p-0 text-xl',
									'overflow-hidden text-left',
									!value ? 'text-white/20' : 'text-white'
								)}>
								{shareForValue}
							</div>
						</div>
						<div className={'w-auto text-right'}>
							<div className={'flex h-8 items-center justify-end gap-2 text-right'}>
								<div className={'relative'}>
									<ImageWithFallback
										className={'size-8 rounded-full border border-purple'}
										style={{width: 32, height: 32, minWidth: 32, minHeight: 32}}
										src={`https://assets.smold.app/tokens/10/${props.vaultData.assetAddress}/logo-128.png`}
										alt={props.vaultData.assetSymbol}
										width={128}
										height={128}
									/>
									<ImageWithFallback
										className={cl(
											'absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-purple',
											'text-xxs text-white',
											'border border-white',
											'flex items-center justify-center'
										)}
										style={{width: 14, height: 14, minWidth: 14, minHeight: 14}}
										src={'/poolToken.png'}
										alt={''}
										width={128}
										height={128}
									/>
								</div>
								<b className={'whitespace-nowrap text-lg'}>{shareData?.symbol}</b>
							</div>
							<p className={'mt-1 whitespace-nowrap text-xs text-white/60'}>
								{`Balance: ${formatAmount(data?.vaultBalanceOf?.normalized || 0, 4)}`}
							</p>
						</div>
					</div>
				</div>
				<div className={'py-4 text-sm font-medium text-white/60'}>
					<p>{'Weekly Chance of Winning'}</p>
					<p>{weeklyChance ? `1 in ${weeklyChance}` : '-'}</p>
				</div>
				<div className={'flex w-full flex-col items-center justify-center gap-2 pt-6 text-center'}>
					<Button
						isDisabled={
							!value ||
							value <= 0 ||
							fromNormalized(value || 0, props.vaultData.decimals) >
								toBigInt(data?.underlyingBalanceOf.raw)
						}
						onClick={onApproveOrDeposit}
						isBusy={approvalStatus.pending || depositStatus.pending}
						className={'h-10 w-full rounded-lg bg-white font-medium text-purple'}>
						{toBigInt(data?.allowance.raw) >= fromNormalized(value || 0, props.vaultData.decimals)
							? 'Deposit'
							: 'Approve'}
					</Button>
				</div>
			</Dialog.Panel>
		</Transition.Child>
	);
}

/**************************************************************************************************
 ** The DepositPopupWrapper is a wrapper around the DepositPopup component. It's purpose is to
 ** handle the visibility of the popup. It's a simple component that takes a boolean prop isOpen
 ** and a function prop onClose. If the isOpen prop is true, it renders the DepositPopup component
 ** with the props passed to the DepositPopupWrapper.
 ** We are using a wrapper to avoid doing unnecessary work in the DepositPopup component when it's
 ** not visible.
 *************************************************************************************************/
export function DepositPopupWrapper(props: TDepositPopupProps): ReactElement {
	if (!props.isOpen) {
		return <Fragment />;
	}

	return (
		<Transition.Root
			show={props.isOpen}
			as={Fragment}>
			<Dialog
				as={'div'}
				className={'relative z-[1000]'}
				onClose={props.onClose}>
				<Transition.Child
					as={Fragment}
					enter={'ease-out duration-300'}
					enterFrom={'opacity-0'}
					enterTo={'opacity-100'}
					leave={'ease-in duration-200'}
					leaveFrom={'opacity-100'}
					leaveTo={'opacity-0'}>
					<div className={'fixed inset-0 bg-primary-900/40 backdrop-blur-sm transition-opacity'} />
				</Transition.Child>

				<div className={'fixed inset-0 z-[1001] w-screen overflow-y-auto'}>
					<div className={'flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'}>
						<DepositPopup
							prizePool={props.prizePool}
							vault={props.vault}
							vaultData={props.vaultData}
							isOpen={props.isOpen}
							onClose={props.onClose}
						/>
					</div>
				</div>
			</Dialog>
		</Transition.Root>
	);
}
