'use client';

import {type ReactElement, useCallback, useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {useQueryState} from 'nuqs';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {usePrices} from '@lib/contexts/usePrices';
import useWallet from '@lib/contexts/useWallet';
import {useAsyncTrigger} from '@lib/hooks/useAsyncTrigger';
import {
	cl,
	formatAmount,
	formatLocalAmount,
	formatPercent,
	isZeroAddress,
	toAddress,
	toNormalizedBN,
	zeroNormalizedBN
} from '@lib/utils';
import {acknowledge, toPercent} from '@lib/utils/tools';
import {getNetwork} from '@lib/utils/wagmi';

import {IconExternalLink} from '../icons/IconExternalLink';
import {DepositModal} from './DepositModal';
import {ImageWithFallback} from './ImageWithFallback';
import {SuccessModal} from './SuccessModal';
import {WithdrawModal} from './WithdrawModal';

import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';
import type {TNormalizedBN} from '@lib/types';
import type {TAPYType} from '@lib/utils/types';

type TVaultItem = {
	vault: TYDaemonVault;
	price: TNormalizedBN;
	options?: {
		apyType: TAPYType;
		shouldDisplaySubAPY?: boolean;
	};
};
export type TSuccessModal = {
	isOpen: boolean;
	description: ReactElement | null;
};

export const VaultItem = ({vault, price, options}: TVaultItem): ReactElement => {
	const {balanceHash, getBalance, getToken, isLoadingOnChain, onRefresh} = useWallet();
	const {configuration} = useManageVaults();
	const {pricingHash, getPrice} = usePrices();
	const [successModal, set_successModal] = useState<TSuccessModal>({isOpen: false, description: null});
	const [vaultPrice, set_vaultPrice] = useState<TNormalizedBN>(zeroNormalizedBN);
	const [selectedVault, set_selectedVault] = useQueryState('vault');
	const [selectedAction, set_selectedAction] = useQueryState('action');
	const isDepositModalOpen = selectedAction === 'DEPOSIT' && selectedVault === vault.address;
	const isWithdrawModalOpen = selectedAction === 'WITHDRAW' && selectedVault === vault.address;
	const {dispatchConfiguration} = useManageVaults();

	/**********************************************************************************************
	 ** APYToUse returns the current APY to display based on the app options.
	 ** @param {TAPYType} options.apyType - The APY type to display (HISTORICAL OR ESTIMATED)
	 ** @returns {number} - The APY to display.
	 *********************************************************************************************/
	const APYToUse = useMemo(() => {
		if (!options?.apyType) {
			return vault.apr.netAPR;
		}
		return options.apyType === 'HISTORICAL' ? vault.apr.netAPR : vault.apr.forwardAPR.netAPR;
	}, [vault.apr, options?.apyType]);

	/**********************************************************************************************
	 ** subAPY returns the the opposite APR to display: ESTIMATED by default, or HISTORICAL if the
	 ** APRType is set to ESTIMATED
	 ** @param {Boolean} options.shouldDisplaySubAPY - If we should display that
	 ** @param {TAPYType} options.apyType - The APR type to display (HISTORICAL OR ESTIMATED)
	 ** @returns {string} - The subAPY to display with a label
	 *********************************************************************************************/
	const subAPY = useMemo(() => {
		if (!options?.shouldDisplaySubAPY) {
			return ' ';
		}
		if (!options?.apyType) {
			return `historical ${toPercent(vault.apr.netAPR)}`;
		}
		if (options.apyType === 'HISTORICAL') {
			return `estimated ${toPercent(vault.apr.forwardAPR.netAPR)}`;
		}
		return `historical ${toPercent(vault.apr.netAPR)}`;
	}, [options?.shouldDisplaySubAPY, options?.apyType, vault.apr.netAPR, vault.apr.forwardAPR.netAPR]);

	/**********************************************************************************************
	 ** useEffect hook to retrieve and memoize prices for the vault token.
	 *********************************************************************************************/
	useEffect(() => {
		acknowledge(pricingHash);
		set_vaultPrice(
			getPrice({
				chainID: Number(configuration?.tokenToSpend.token?.chainID),
				address: toAddress(configuration?.tokenToSpend.token?.address)
			}) || zeroNormalizedBN
		);
	}, [pricingHash, configuration?.tokenToSpend.token, getPrice]);

	/**********************************************************************************************
	 ** In some situations, the token is not in the list and we need to fetch/get it. This
	 ** hooks will trigger the onRefresh function to fetch the token once we are sure that we are
	 ** missing it.
	 *********************************************************************************************/
	useAsyncTrigger(async () => {
		if (!isLoadingOnChain(vault.chainID)) {
			const token = getToken({address: vault.address, chainID: vault.chainID});
			if (isZeroAddress(token.address)) {
				onRefresh([{chainID: vault.chainID, address: vault.address}]);
			}
		}
	}, [getToken, isLoadingOnChain, onRefresh, vault.address, vault.chainID]);

	/**********************************************************************************************
	 ** Retrieve the user's balance for the current vault. We will use the getBalance function
	 ** from the useWallet hook to retrieve the balance. We are using balanceHash as a dependency
	 ** to trigger the useEffect hook when the balances object changes.
	 *********************************************************************************************/
	const balance = useMemo(() => {
		acknowledge(balanceHash);
		const value = getBalance({address: vault.address, chainID: vault.chainID}).normalized || 0;
		return value;
	}, [getBalance, vault.address, vault.chainID, balanceHash]);

	/**********************************************************************************************
	 ** The totalDeposits is the total value locked in the vault. We will use the tvl property
	 ** from the vault object and format it using the formatAmount function.
	 *********************************************************************************************/
	const totalDeposits = useMemo(() => {
		if (vault.tvl.tvl === 0) {
			return '$0.00';
		}
		if (vault.tvl.tvl < 0.01) {
			return '$0.00';
		}
		return `$${formatLocalAmount(vault.tvl.tvl, 4, '$', {
			displayDigits: 2,
			maximumFractionDigits: 2,
			minimumFractionDigits: 2,
			shouldCompactValue: true
		})}`;
	}, [vault.tvl.tvl]);

	/**********************************************************************************************
	 ** totalProfit is the value the user could potentially get after 1 year of stacking money.
	 ** We are basically multiply amount the users typed with apy and price of the token.
	 *********************************************************************************************/
	const totalProfit = useMemo(() => {
		const price = vaultPrice.normalized ?? 0;
		return `$${formatLocalAmount(
			Number(configuration?.tokenToSpend.amount?.normalized) * APYToUse * price +
				Number(configuration?.tokenToSpend.amount?.normalized) * price,
			4,
			'$',
			{
				displayDigits: 2,
				maximumFractionDigits: 2,
				minimumFractionDigits: 2,
				shouldCompactValue: true
			}
		)}`;
	}, [configuration?.tokenToSpend.amount?.normalized, APYToUse, vaultPrice.normalized]);

	/**********************************************************************************************
	 ** onDepositClick is a callback that sets "DEPOSIT" (and it opens deposit modal) to reducer
	 ** as action and sets vault token as default to be deposited.
	 *********************************************************************************************/
	const onDepositClick = useCallback(async (): Promise<void> => {
		set_selectedVault(vault.address);
		set_selectedAction('DEPOSIT');
	}, [set_selectedAction, set_selectedVault, vault]);

	/**********************************************************************************************
	 ** onWithdrawClick is a callback that sets "WITHDRAW" (and it opens withdraw modal) to reducer
	 ** as action and sets vault token as default to be withdrawn.
	 *********************************************************************************************/
	const onWithdrawClick = useCallback(async (): Promise<void> => {
		set_selectedVault(vault.address);
		set_selectedAction('WITHDRAW');
	}, [set_selectedAction, set_selectedVault, vault]);

	/**********************************************************************************************
	 ** Create the link to the Yearn.fi website. The link will be different depending on the
	 ** vault version.
	 *********************************************************************************************/
	const yearnfiLink = useMemo(() => {
		const vaultOrV3 = vault.version.startsWith('3') || vault.version.startsWith('~3') ? 'v3' : 'vaults';
		return `https://yearn.fi/${vaultOrV3}/${vault.chainID}/${vault.address}`;
	}, [vault.address, vault.chainID, vault.version]);

	/**********************************************************************************************
	 ** onClose contains the actions to perform when the modal is closed. It resets the
	 ** configuration reducer, closes the modal and clear the URL query state.
	 *********************************************************************************************/
	const onClose = useCallback(() => {
		dispatchConfiguration({type: 'RESET'});
		set_selectedVault(null);
		set_selectedAction(null);
	}, [dispatchConfiguration, set_selectedAction, set_selectedVault]);

	return (
		<div>
			<DepositModal
				isOpen={isDepositModalOpen}
				onClose={onClose}
				vault={vault}
				yearnfiLink={yearnfiLink}
				hasBalanceForVault={balance > 0}
				openSuccessModal={set_successModal}
				totalProfit={totalProfit}
				apy={APYToUse}
			/>
			<WithdrawModal
				isOpen={isWithdrawModalOpen}
				onClose={onClose}
				vault={vault}
				yearnfiLink={yearnfiLink}
				hasBalanceForVault={balance > 0}
				openSuccessModal={set_successModal}
			/>
			<SuccessModal
				onClose={() => set_successModal({isOpen: false, description: null})}
				isOpen={successModal.isOpen}
				description={successModal.description}
			/>

			{/* Desktop screen Item */}
			<div className={'bg-regularText/3 hidden h-24 min-h-[68px] rounded-xl p-2.5 md:grid md:grid-cols-7'}>
				<Link
					href={yearnfiLink}
					target={'_blank'}
					className={
						'border-regularText/15 bg-regularText/5 col-span-2 flex cursor-alias items-center justify-start overflow-hidden rounded-xl border p-3'
					}>
					<ImageWithFallback
						src={`https://assets.smold.app/tokens/${vault.chainID}/${vault.token.address}/logo-32.png`}
						alt={vault.token.symbol}
						width={28}
						height={28}
					/>
					<div className={'ml-2 flex w-full flex-col justify-start overflow-hidden'}>
						<div className={'flex items-center justify-between gap-x-2'}>
							<p className={'w-full truncate'}>{vault.name}</p>
							<IconExternalLink className={'ml-auto size-3 min-w-3'} />
						</div>

						<p className={'text-regularText/50 w-full'}>{getNetwork(vault.chainID).name}</p>
					</div>
				</Link>
				<div className={'font-number flex items-center justify-end'}>
					<div className={'text-right font-mono font-semibold'}>
						{toPercent(APYToUse)}
						<div className={'text-regularText truncate text-right text-xs font-normal text-opacity-40'}>
							{subAPY}
						</div>
					</div>
				</div>

				<div className={'font-number flex items-center justify-end'}>
					<div className={'text-right font-mono'}>
						{totalDeposits}
						<div className={'text-regularText invisible text-right text-xs'}>&nbsp;</div>
					</div>
				</div>

				<div className={'font-number flex items-center justify-end'}>
					<div className={'w-2/3 overflow-hidden text-right font-mono'}>
						{`$${formatAmount(balance * price.normalized, 2, 2)}`}
						<div
							title={`${formatAmount(balance * toNormalizedBN(vault.pricePerShare, vault.decimals).normalized)} ${
								vault.token.symbol
							}`}
							className={'text-regularText truncate text-right text-xs text-opacity-40'}>
							{`${formatAmount(balance * toNormalizedBN(vault.pricePerShare, vault.decimals).normalized)} ${vault.token.symbol}`}
						</div>
					</div>
				</div>
				<div className={cl('col-span-2 flex items-center justify-end gap-x-2 pl-10')}>
					{balance ? (
						<button
							onClick={onWithdrawClick}
							className={
								'border-regularText/5 bg-regularText/5 text-regularText hover:bg-regularText/15 !h-12 w-full rounded-xl border p-3 transition-colors '
							}>
							{'Withdraw'}
						</button>
					) : null}
					<button
						onClick={onDepositClick}
						className={
							'bg-button text-accentText hover:buttonHover !h-12 w-full rounded-xl p-3 transition-colors hover:text-black'
						}>
						{'Deposit'}
					</button>
				</div>
			</div>

			{/* Mobile screen Item */}
			<div className={'bg-table flex w-full flex-col gap-y-6 rounded-2xl p-6 md:hidden'}>
				<Link
					href={yearnfiLink}
					target={'_blank'}
					className={
						'border-regularText/15 bg-regularText/5 flex w-full items-center rounded-xl border px-2.5 py-2'
					}>
					<ImageWithFallback
						src={`https://assets.smold.app/tokens/${vault.chainID}/${vault.token.address}/logo-32.png`}
						alt={vault.token.symbol}
						width={28}
						height={28}
					/>
					<div className={'ml-2 flex flex-col justify-start'}>
						<div className={'flex items-center gap-x-2'}>
							<p className={'w-full'}>{vault.name}</p>
							<IconExternalLink className={'size-4'} />
						</div>

						<p className={'text-regularText/50 w-full'}>{getNetwork(vault.chainID).name}</p>
					</div>
				</Link>

				<div className={'flex w-full justify-between'}>
					<div className={'flex items-center gap-x-2 text-sm'}>
						<p>{'APY'}</p>
					</div>
					<div>{formatPercent(APYToUse)}</div>
				</div>

				<div className={'flex w-full justify-between'}>
					<div className={'flex items-center'}>
						<p>{'Total Deposits'}</p>
					</div>
					<div>{totalDeposits}</div>
				</div>

				<div className={'flex w-full justify-between'}>
					<div className={'flex items-center'}>
						<p>{'My balance'}</p>
					</div>
					<div>{balance}</div>
				</div>

				<div className={'flex gap-x-6'}>
					{balance ? (
						<button
							onClick={onWithdrawClick}
							className={
								'border-regularText/5 bg-regularText/5 text-regularText hover:bg-regularText/15 !h-12 w-full rounded-xl border p-3 transition-colors '
							}>
							{'Withdraw'}
						</button>
					) : null}
					<button
						onClick={onDepositClick}
						className={
							'bg-button hover:bg-buttonHover text-accentText !h-12 w-full rounded-xl p-3 transition-colors'
						}>
						{'Deposit'}
					</button>
				</div>
			</div>
		</div>
	);
};
