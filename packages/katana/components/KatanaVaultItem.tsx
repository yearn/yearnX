'use client';

import {type ReactElement, useCallback, useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {useQueryState} from 'nuqs';
import {AprModal} from 'packages/katana/components/AprModal';
import {WETHDepositModal} from 'packages/katana/components/WETHDepositModal';
import {useAccount} from 'wagmi';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {usePrices} from '@lib/contexts/usePrices';
import useWallet from '@lib/contexts/useWallet';
import {useAsyncTrigger} from '@lib/hooks/useAsyncTrigger';
import {
	cl,
	formatAmount,
	formatLocalAmount,
	isZeroAddress,
	toAddress,
	toNormalizedBN,
	zeroNormalizedBN
} from '@lib/utils';
import {acknowledge, toPercent} from '@lib/utils/tools';
import {CHAINS} from '@lib/utils/tools.chains';
import {getNetwork} from '@lib/utils/wagmi';

import {DepositModal} from '../../lib/components/common/DepositModal';
import {ImageWithFallback} from '../../lib/components/common/ImageWithFallback';
import {SuccessModal} from '../../lib/components/common/SuccessModal';
import {WithdrawModal} from '../../lib/components/common/WithdrawModal';
import {IconExternalLink} from '../../lib/components/icons/IconExternalLink';
import {IconInfo} from '../../lib/components/icons/InfoIcon';
import {STEER_REWARD_RATES} from '../constants';

import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';
import type {TNormalizedBN} from '@lib/types';
import type {TAPYType} from '@lib/utils/types';
import type {TAprData} from '../hooks/useKatanaAprs';

type TVaultItem = {
	vault: TYDaemonVault;
	price: TNormalizedBN;
	apr?: TAprData;
	options?: {
		apyType: TAPYType;
		shouldDisplaySubAPY?: boolean;
	};
};
export type TSuccessModal = {
	isOpen: boolean;
	description: ReactElement | null;
};

export const VaultItem = ({vault, price, options, apr}: TVaultItem): ReactElement => {
	const {address} = useAccount();
	const {balanceHash, getBalance, getToken, isLoadingOnChain, onRefresh} = useWallet();
	const {configuration} = useManageVaults();
	const {pricingHash, getPrice} = usePrices();
	const [successModal, set_successModal] = useState<TSuccessModal>({isOpen: false, description: null});
	const [vaultPrice, set_vaultPrice] = useState<TNormalizedBN>(zeroNormalizedBN);
	const [selectedVault, set_selectedVault] = useQueryState('vault');
	const [selectedAction, set_selectedAction] = useQueryState('action');
	const [isAprModalOpen, set_isAprModalOpen] = useState(false);
	const [isSteerPopoverOpen, set_isSteerPopoverOpen] = useState(false);
	const isDepositModalOpen = selectedAction === 'DEPOSIT' && selectedVault === vault.address;
	const isWithdrawModalOpen = selectedAction === 'WITHDRAW' && selectedVault === vault.address;
	const {dispatchConfiguration} = useManageVaults();

	/**********************************************************************************************
	 ** Compute numeric STEER reward points per dollar invested for this vault. Points are allocated based
	 ** on strategies whose names include a positive-rate key from STEER_REWARD_RATES and have
	 ** totalDebt > 0. Each strategy contributes: rate * (debtRatio / 10000). The result is the sum.
	 ** Update STEER_REWARD_RATES in packages/katana/constants.ts to change allocations.
	 *********************************************************************************************/
	const steerRewardPoints = useMemo(() => {
		const eligible = (vault.strategies ?? []).filter(s => {
			const name = s?.name?.toLowerCase() ?? '';
			const hasPositiveRewardKeyMatch = Object.entries(STEER_REWARD_RATES).some(([key, rate]) => {
				return rate > 0 && name.includes(key.toLowerCase());
			});
			return hasPositiveRewardKeyMatch && Number(s?.details?.totalDebt) > 0;
		});

		const total = eligible.reduce((sum, s) => {
			const name = s?.name?.toLowerCase() ?? '';
			const match = Object.entries(STEER_REWARD_RATES).find(
				([key, rate]) => rate > 0 && name.includes(key.toLowerCase())
			);
			const rate = match ? Number(match[1]) : 0;
			const debtRatioRaw = Number(s?.details?.debtRatio) || 0; // 10000 = 100%
			const debtRatio = Math.min(Math.max(debtRatioRaw / 10000, 0), 1);
			return sum + rate * debtRatio;
		}, 0);

		return total;
	}, [vault.strategies]);

	const isEligibleForSteerRewards = steerRewardPoints > 0;
		// Debug log removed for production
	}

	/**********************************************************************************************
	 ** APYToUse returns the current APY to display based on the app options.
	 ** @param {TAPYType} options.apyType - The APY type to display (HISTORICAL OR ESTIMATED)
	 ** @returns {number} - The APY to display.
	 *********************************************************************************************/
	const APYToUse = useMemo(() => {
		if (apr) {
			// Exclude legacy katanaRewardsAPR to avoid double counting with katanaAppRewardsAPR
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const {katanaRewardsAPR: _katanaRewardsAPR, ...relevantAprs} = apr;
			return Object.values(relevantAprs).reduce((sum, value) => sum + value, 0);
		}
		if (!options?.apyType) {
			return vault.apr.netAPR;
		}
		return options.apyType === 'HISTORICAL' ? vault.apr.netAPR : vault.apr.forwardAPR.netAPR;
	}, [vault.apr, options?.apyType, apr]);

	/**********************************************************************************************
	 ** subAPY returns the the opposite APR to display: ESTIMATED by default, or HISTORICAL if the
	 ** APRType is set to ESTIMATED
	 ** @param {Boolean} options.shouldDisplaySubAPY - If we should display that
	 ** @param {TAPYType} options.apyType - The APR type to display (HISTORICAL OR ESTIMATED)
	 ** @returns {string} - The subAPY to display with a label
	 *********************************************************************************************/
	// const subAPY = useMemo(() => {
	// 	if (!options?.shouldDisplaySubAPY) {
	// 		return '';
	// 	}
	// 	if (!options?.apyType) {
	// 		return `historical ${toPercent(vault.apr.netAPR)}`;
	// 	}
	// 	if (options.apyType === 'HISTORICAL') {
	// 		return `estimated ${toPercent(vault.apr.forwardAPR.netAPR)}`;
	// 	}
	// 	return `historical ${toPercent(vault.apr.netAPR)}`;
	// }, [options?.shouldDisplaySubAPY, options?.apyType, vault.apr.netAPR, vault.apr.forwardAPR.netAPR]);

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
		if (address === undefined) {
			return;
		}
		if (!isLoadingOnChain(vault.chainID)) {
			const token = getToken({address: vault.address, chainID: vault.chainID});
			if (isZeroAddress(token.address)) {
				onRefresh([{chainID: vault.chainID, address: vault.address}]);
			}
		}
	}, [getToken, isLoadingOnChain, onRefresh, vault.address, vault.chainID, address]);

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
			Number(configuration?.tokenToSpend.amount?.normalized) * APYToUse * price,
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

	/**********************************************************************************************
	 ** Get the background color for the chain from the CHAINS object
	 *********************************************************************************************/
	const chainBgColor = useMemo(() => {
		const chain = CHAINS[vault.chainID];
		return chain?.bgColor || '#374151'; // fallback to gray if no color defined
	}, [vault.chainID]);

	// Check if this is a WETH vault
	const isWETHVault = useMemo(() => {
		return vault.token.address.toLowerCase() === '0xee7d8bcfb72bc1880d0cf19822eb0a2e6577ab62';
	}, [vault.token.address]);

	return (
		<div>
			<AprModal
				isOpen={isAprModalOpen}
				onClose={() => set_isAprModalOpen(false)}
				vault={vault}
				apr={apr}
				steerRewardPoints={steerRewardPoints}
			/>
			{isWETHVault ? (
				<WETHDepositModal
					isOpen={isDepositModalOpen}
					onClose={onClose}
					vault={vault}
					yearnfiLink={yearnfiLink}
					hasBalanceForVault={balance > 0}
					openSuccessModal={set_successModal}
					totalProfit={totalProfit}
					apy={APYToUse}
				/>
			) : (
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
			)}
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
			<div
				className={'bg-regularText/3 hidden h-24 min-h-[68px] rounded-xl p-2.5 md:grid md:grid-cols-12'}
				style={{
					backgroundColor: `${chainBgColor}15`, // 15 is ~8% opacity in hex
					borderLeft: `3px solid ${chainBgColor}`
				}}>
				<Link
					href={yearnfiLink}
					target={'_blank'}
					className={
						'border-regularText/15 bg-regularText/5 col-span-3 flex cursor-alias items-center justify-start overflow-hidden rounded-xl border p-3'
					}>
					<ImageWithFallback
						src={`https://assets.smold.app/tokens/${vault.chainID}/${vault.token.address}/logo-32.png`}
						altSrc={`/tokens/${vault.token.address.toLowerCase()}/logo-32.png`}
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

				{/* APY */}
				<div className={'font-number col-span-2 flex items-center justify-end'}>
					<div className={'flex flex-col items-end'}>
						<div className={'relative flex items-center gap-x-2 text-right font-mono font-semibold'}>
							<span>{toPercent(APYToUse)}</span>
							<button
								onClick={() => set_isAprModalOpen(true)}
								className={'text-white/60 transition-colors hover:text-white'}>
								<IconInfo className={'size-4'} />
							</button>
						</div>
						{isEligibleForSteerRewards ? (
							<div
								className={'text-regularText relative inline-block text-right text-xs'}
								onMouseEnter={() => set_isSteerPopoverOpen(true)}
								onMouseLeave={() => set_isSteerPopoverOpen(false)}>
								<button
									type={'button'}
									className={'underline decoration-dotted hover:opacity-80'}>
									{'Eligible for Steer Points'}
								</button>
								{isSteerPopoverOpen ? (
									<div
										className={
											'border-regularText/15 bg-table absolute right-[-50px] z-20 min-w-[210px] rounded-md border p-3 text-left shadow-lg'
										}>
										<p className={'text-regularText text-left text-xs leading-relaxed'}>
											{'This vault earns '}
											{formatAmount(steerRewardPoints, 2, 2)}
											{' STEER points / dollar deposited, but you must '}
											<a
												className={'text-accentText underline'}
												href={'https://app.steer.finance/points'}
												target={'_blank'}
												rel={'noreferrer'}>
												{'register here to earn them'}
											</a>
											{'.'}
										</p>
									</div>
								) : null}
							</div>
						) : (
							<div className={'text-regularText invisible text-right text-xs'}>&nbsp;</div>
						)}
					</div>
				</div>

				{/* TVL */}
				<div className={'font-number col-span-2 flex items-center justify-end'}>
					<div className={'text-right font-mono'}>
						{totalDeposits}
						{vault.category.toLowerCase() === 'volatile' ? (
							<div className={'text-regularText text-right text-xs'}>
								{`${formatAmount(Number(vault.tvl.tvl) / vaultPrice.normalized, 2, 2)} ${vault.token.symbol}`}
							</div>
						) : (
							<div className={'text-regularText invisible text-right text-xs'}>&nbsp;</div>
						)}
					</div>
				</div>

				<div className={'font-number col-span-2 flex items-center justify-end'}>
					<div className={'w-2/3 overflow-hidden text-right font-mono'}>
						{`$${formatAmount(balance * price.normalized, 2, 2)}`}
						<div
							title={`${formatAmount(balance * toNormalizedBN(vault.pricePerShare, vault.decimals).normalized)} ${
								vault.token.symbol
							}`}
							className={'text-regularText truncate text-right text-xs text-opacity-40'}>
							{`${formatAmount(balance * toNormalizedBN(vault.pricePerShare, vault.decimals).normalized, 0, 6)} ${vault.token.symbol}`}
						</div>
					</div>
				</div>
				<div className={cl('col-span-3 flex items-center justify-end gap-x-2 pl-20')}>
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
							'bg-button text-accentText !h-12 w-full rounded-xl p-3 transition-colors hover:bg-[#f8fe06] hover:text-black'
						}>
						{'Deposit'}
					</button>
				</div>
			</div>

			{/* Mobile screen Item */}
			<div
				className={'bg-table flex w-full flex-col gap-y-6 rounded-2xl p-6 md:hidden'}
				style={{
					backgroundColor: `${chainBgColor}10`, // 10 is ~6% opacity in hex
					borderLeft: `3px solid ${chainBgColor}`
				}}>
				<Link
					href={yearnfiLink}
					target={'_blank'}
					className={
						'border-regularText/15 bg-regularText/5 flex w-full items-center rounded-xl border px-2.5 py-2'
					}>
					<ImageWithFallback
						src={`https://assets.smold.app/tokens/${vault.chainID}/${vault.token.address}/logo-32.png`}
						altSrc={`/tokens/${vault.token.address.toLowerCase()}/logo-32.png`}
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
					<div className={'flex items-center gap-x-2'}>
						<span>{toPercent(APYToUse)}</span>
						<button
							onClick={() => set_isAprModalOpen(true)}
							className={'text-white/60 transition-colors hover:text-white'}>
							<IconInfo className={'size-4'} />
						</button>
					</div>
				</div>

				<div className={'flex w-full justify-between'}>
					<div className={'flex items-center'}>
						<p>{'TVL'}</p>
					</div>
					<div>{totalDeposits}</div>
				</div>

				<div className={'flex w-full justify-between'}>
					<div className={'flex items-center'}>
						<p>{'My balance'}</p>
					</div>
					<div className={'text-right'}>
						{' '}
						{`$${formatAmount(balance * price.normalized, 2, 2)}`}
						<div
							title={`${formatAmount(balance * toNormalizedBN(vault.pricePerShare, vault.decimals).normalized)} ${
								vault.token.symbol
							}`}
							className={'text-regularText truncate text-right text-xs text-opacity-40'}>
							{`${formatAmount(balance * toNormalizedBN(vault.pricePerShare, vault.decimals).normalized, 0, 6)} ${vault.token.symbol}`}
						</div>
					</div>
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
