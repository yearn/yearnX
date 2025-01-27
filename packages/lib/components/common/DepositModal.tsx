import {Fragment, useCallback, useEffect, useMemo} from 'react';
import {usePlausible} from 'next-plausible';
import {motion} from 'framer-motion';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {formatBigIntForDisplay} from '@generationsoftware/hyperstructure-client-js';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {useSolver} from '@lib/contexts/useSolver';
import {useIsZapNeeded} from '@lib/hooks/useIsZapNeeded';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {useAccountModal} from '@rainbow-me/rainbowkit';

import {IconCross} from '../icons/IconCross';
import {ModalWrapper} from './ModalWrapper';
import {TokenAmountWrapper} from './TokenAmountInput';
import {VaultLink} from './VaultLink';

import type {Dispatch, ReactElement, SetStateAction} from 'react';
import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';
import type {TSuccessModal} from './VaultItem';

type TDepositModalProps = {
	isOpen: boolean;
	onClose: () => void;
	vault: TYDaemonVault;
	yearnfiLink: string;
	hasBalanceForVault: boolean;
	openSuccessModal: Dispatch<SetStateAction<TSuccessModal>>;
	apy: number;
	totalProfit?: string;
};

export function DepositModalContent(props: TDepositModalProps): ReactElement {
	const plausible = usePlausible();
	const {getBalance} = useWallet();
	const {address, isWalletSafe} = useWeb3();
	const {openAccountModal} = useAccountModal();
	const {configuration, dispatchConfiguration} = useManageVaults();
	const {isZapNeededForDeposit} = useIsZapNeeded(configuration);
	const {canZap, onApprove, isApproving, isDepositing, onDeposit, canDeposit, isFetchingQuote, quote} = useSolver();

	/**********************************************************************************************
	 ** buttonTitle for deposit only button depends - on wallet(if wallet isn't connected, button
	 ** says 'Connect Wallet'), - on isApproved(if token to deposit isn't approve, button says
	 ** 'Approve'). And if everything is ready for deposit, it says 'Deposit'.
	 *********************************************************************************************/
	const getButtonTitle = useMemo((): string => {
		if (!address) {
			return 'Connect Wallet';
		}
		if (!canZap && !isFetchingQuote) {
			return 'Impossible to zap in';
		}
		if (isWalletSafe) {
			return 'Approve and Deposit';
		}
		if (canDeposit) {
			return 'Deposit';
		}

		return 'Approve';
	}, [address, canDeposit, canZap, isFetchingQuote, isWalletSafe]);

	const isBusy = !configuration?.tokenToSpend.amount?.normalized
		? false
		: Boolean(isApproving || isDepositing || isDepositing || isFetchingQuote);

	/**********************************************************************************************
	 ** onAction is a callback that decides what to do on button click. If wallet isn't connected,
	 ** button opens Wallet connect modal. If wallet's connected, but token isn't approved, is
	 ** calls approve contract. And if everything's ready, it calls onExecuteDeposit function,
	 ** and if everything is successfull, we close deposit modal and open successModal.
	 *********************************************************************************************/
	const onAction = useCallback(async () => {
		if (!address) {
			openAccountModal?.();
		}
		if (canDeposit) {
			const isSuccess = await onDeposit(receipt => console.info('receipt: ', receipt));
			if (isSuccess) {
				plausible(PLAUSIBLE_EVENTS.DEPOSIT, {
					props: {
						vaultAddress: props.vault.address,
						vaultSymbol: props.vault.symbol,
						amountToDeposit: configuration.tokenToSpend.amount?.display,
						tokenAddress: configuration.tokenToSpend.token?.address,
						tokenSymbol: configuration.tokenToSpend.token?.symbol,
						isZap: isZapNeededForDeposit
					}
				});
				props.onClose();
				props.openSuccessModal({
					isOpen: true,
					description: (
						<span>
							<span className={'text-regularText/50 whitespace-nowrap'}>{'Successfully deposited'}</span>
							&nbsp;
							<span>
								{!isZapNeededForDeposit
									? configuration?.tokenToSpend.amount?.display.slice(0, 7)
									: formatBigIntForDisplay(
											configuration?.tokenToSpend.amount?.raw ?? 0n,
											configuration?.tokenToSpend.token?.decimals ?? 18,
											{maximumFractionDigits: 6}
										)}
								&nbsp;
								<span>{configuration?.tokenToSpend?.token?.symbol}</span>
								<span className={'text-regularText/50'}>
									<span className={'mx-1'}>{'to'}</span>
									{configuration?.vault?.name}
								</span>
							</span>
						</span>
					)
				});
			}
		} else {
			onApprove();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		address,
		canDeposit,
		configuration?.tokenToSpend.amount?.display,
		configuration?.tokenToSpend.amount?.raw,
		configuration?.tokenToSpend.token?.decimals,
		configuration?.tokenToSpend.token?.symbol,
		configuration?.vault?.name,
		isZapNeededForDeposit,
		onApprove,
		onDeposit,
		openAccountModal
	]);

	/**********************************************************************************************
	 ** useMemo hook to determine the validity of the current configuration for a deposit action.
	 ** - Returns `false` if a zap is needed for the deposit and no quote is available.
	 ** - Returns `false` if the amount or token to spend is not specified in the configuration.
	 ** - Returns `false` if the token to spend has the same address as the vault.
	 ** - Returns `true` if none of the above conditions are met, indicating a valid configuration.
	 *********************************************************************************************/
	const isValid = useMemo((): boolean => {
		if (isZapNeededForDeposit && !quote) {
			return false;
		}
		if (!configuration?.tokenToSpend.amount || !configuration?.tokenToSpend.token) {
			return false;
		}

		if (configuration?.tokenToSpend.token.address === configuration?.vault?.address) {
			return false;
		}

		return true;
	}, [
		configuration?.tokenToSpend.amount,
		configuration?.tokenToSpend.token,
		configuration?.vault?.address,
		isZapNeededForDeposit,
		quote
	]);

	/**********************************************************************************************
	 ** useEffect hook that will trigger the dispatchConfiguration call when the deposit modal is
	 ** open. It will set the deposit action and the vault token as default to be deposited.
	 ** This effect is triggered by the isDepositModalOpen value being true, which is set thanks
	 ** to the useQueryState hook.
	 *********************************************************************************************/
	useEffect(() => {
		dispatchConfiguration({
			type: 'SET_DEPOSIT',
			payload: {
				vault: props.vault,
				toSpend: {
					token: {
						address: props.vault.token.address,
						name: props.vault.token.name,
						symbol: props.vault.token.symbol,
						decimals: props.vault.token.decimals,
						chainID: props.vault.chainID,
						value: 0
					},
					amount: getBalance({address: props.vault.token.address, chainID: props.vault.chainID})
				}
			}
		});
	}, [dispatchConfiguration, getBalance, props.vault]);

	return (
		<ModalWrapper
			isOpen={props.isOpen}
			onClose={props.onClose}>
			<motion.div
				initial={{scale: 0.95, opacity: 0}}
				animate={{scale: 1, opacity: 1}}
				transition={{
					duration: 0.2,
					ease: 'easeInOut'
				}}
				className={'bg-background relative rounded-2xl p-10 md:min-w-[640px]'}>
				<button
					onClick={() => props.onClose()}
					className={
						'hover:bg-regularText/15 absolute right-5 top-5 -m-2 rounded-full p-2 transition-colors'
					}>
					<IconCross className={'text-regularText size-4'} />
				</button>

				<div className={'mb-4 flex w-full justify-start'}>
					<p className={'text-lg font-bold'}>{'Deposit'}</p>
				</div>

				<VaultLink
					vault={props.vault}
					yearnfiLink={props.yearnfiLink}
				/>
				<div className={'flex w-full flex-col items-start gap-y-1'}>
					<TokenAmountWrapper
						vault={props.vault}
						buttonTitle={getButtonTitle}
						isPerformingAction={isBusy}
						onActionClick={onAction}
						isDisabled={!isValid && Boolean(address)}
						set_tokenToUse={(token, amount) =>
							dispatchConfiguration({type: 'SET_TOKEN_TO_SPEND', payload: {token, amount}})
						}
						totalProfit={props.totalProfit}
						apy={props.apy}
					/>
				</div>
			</motion.div>
		</ModalWrapper>
	);
}

export function DepositModal(props: TDepositModalProps): ReactElement {
	if (!props.isOpen) {
		return <Fragment />;
	}
	return <DepositModalContent {...props} />;
}
