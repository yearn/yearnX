import {Fragment, type ReactElement, useCallback, useMemo} from 'react';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl} from '@builtbymom/web3/utils';
import {formatBigIntForDisplay} from '@generationsoftware/hyperstructure-client-js';
import {Dialog, Transition, TransitionChild} from '@headlessui/react';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {useSolver} from '@lib/contexts/useSolver';
import {useIsZapNeeded} from '@lib/hooks/useIsZapNeeded';
import {useAccountModal} from '@rainbow-me/rainbowkit';

import {IconCross} from '../icons/IconCross';
import {TokenAmountWrapper} from './TokenAmountInput';
import {VaultLink} from './VaultLink';

import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';

type TDepositModalProps = {
	isOpen: boolean;
	onClose: () => void;
	vault: TYDaemonVault;
	yearnfiLink: string;
	hasBalanceForVault: boolean;
	set_isSuccessModalOpen: (isOpen: boolean) => void;
	set_successModalDescription: (value: ReactElement) => void;
	totalProfit?: string;
};

export function DepositModal(props: TDepositModalProps): ReactElement {
	const {address, isWalletSafe} = useWeb3();
	const {openAccountModal} = useAccountModal();
	const {configuration, dispatchConfiguration} = useManageVaults();
	const {isZapNeededForDeposit} = useIsZapNeeded(configuration);
	const {canZap} = useSolver();

	/**********************************************************************************************
	 ** buttonTitle for deposit only button depends - on wallet(if wallet isn't connected, button
	 ** says 'Connect Wallet'), - on isApproved(if token to deposit isn't approve, button says
	 ** 'Approve'). And if everything is ready for deposit, it says 'Deposit'.
	 *********************************************************************************************/
	const getButtonTitle = (): string => {
		if (!address) {
			return 'Connect Wallet';
		}
		if (!canZap && !isFetchingQuote) {
			return 'Impossible to zap in';
		}
		if (isWalletSafe) {
			return 'Approve and Deposit';
		}
		if (isApproved) {
			return 'Deposit';
		}

		return 'Approve';
	};

	const {
		onApprove,
		isApproved,
		isApproving,
		onExecuteDeposit,
		onDepositForGnosis,
		depositStatus,
		isFetchingQuote,
		quote
	} = useSolver();

	const isBusy = !configuration?.tokenToSpend.amount?.normalized
		? false
		: Boolean(isApproving || depositStatus?.pending || isFetchingQuote);

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
		if (isWalletSafe) {
			return onDepositForGnosis?.(() => {
				props.onClose();
				props.set_isSuccessModalOpen(true);
				props.set_successModalDescription(
					<div className={'flex flex-col items-center'}>
						<p className={'text-regularText/50 whitespace-nowrap'}>{'Successfully deposited'}</p>

						<div className={'flex'}>
							{!isZapNeededForDeposit
								? configuration?.tokenToSpend.amount?.display.slice(0, 7)
								: formatBigIntForDisplay(
										configuration?.tokenToSpend.amount?.raw ?? 0n,
										configuration?.tokenToSpend.token?.decimals ?? 18,
										{maximumFractionDigits: 6}
									)}
							<p className={'ml-1'}>{configuration?.tokenToSpend?.token?.symbol}</p>
							<span className={'text-regularText/50'}>
								<span className={'mx-1'}>{'to'}</span>
								{configuration?.vault?.name}
							</span>
						</div>
					</div>
				);
			});
		}
		if (isApproved) {
			return onExecuteDeposit?.(() => {
				props.onClose();
				props.set_isSuccessModalOpen(true);
				props.set_successModalDescription(
					<div className={'flex flex-col items-center'}>
						<p className={'text-regularText/50 whitespace-nowrap'}>{'Successfully deposited'}</p>

						<div className={'flex'}>
							{!isZapNeededForDeposit
								? configuration?.tokenToSpend.amount?.display.slice(0, 7)
								: formatBigIntForDisplay(
										configuration?.tokenToSpend.amount?.raw ?? 0n,
										configuration?.tokenToSpend.token?.decimals ?? 18,
										{maximumFractionDigits: 6}
									)}
							<p className={'ml-1'}>{configuration?.tokenToSpend?.token?.symbol}</p>
							<span className={'text-regularText/50'}>
								<span className={'mx-1'}>{'to'}</span>
								{configuration?.vault?.name}
							</span>
						</div>
					</div>
				);
			});
		}
		return onApprove?.();
	}, [
		address,
		configuration?.tokenToSpend.amount?.display,
		configuration?.tokenToSpend.amount?.raw,
		configuration?.tokenToSpend.token?.decimals,
		configuration?.tokenToSpend.token?.symbol,
		configuration?.vault?.name,
		isApproved,
		isWalletSafe,
		isZapNeededForDeposit,
		onApprove,
		onDepositForGnosis,
		onExecuteDeposit,
		openAccountModal,
		props
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

	return (
		<Transition
			show={props.isOpen}
			as={Fragment}>
			<Dialog
				as={'div'}
				className={'relative z-[1000] flex h-screen w-screen items-center justify-center'}
				onClose={props.onClose}>
				<TransitionChild
					as={Fragment}
					enter={'ease-out duration-200'}
					enterFrom={'opacity-0'}
					enterTo={'opacity-100'}
					leave={'ease-in duration-200'}
					leaveFrom={'opacity-100'}
					leaveTo={'opacity-0'}>
					<div
						onClick={() => props.onClose()}
						className={'fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity'}
					/>
				</TransitionChild>

				<TransitionChild
					as={Fragment}
					enter={'ease-out duration-300'}
					enterFrom={'opacity-0'}
					enterTo={'opacity-100'}
					leave={'ease-in duration-200'}
					leaveFrom={'opacity-100'}
					leaveTo={'opacity-0'}>
					<div className={cl('fixed -translate-y-1/2 top-1/2 p-4 text-center sm:items-center sm:p-0')}>
						<div className={'bg-background relative rounded-2xl p-10 md:min-w-[640px]'}>
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
									buttonTitle={getButtonTitle()}
									isPerformingAction={isBusy}
									onActionClick={onAction}
									isDisabled={!isValid && Boolean(address)}
									set_tokenToUse={(token, amount) =>
										dispatchConfiguration({type: 'SET_TOKEN_TO_SPEND', payload: {token, amount}})
									}
									totalProfit={props.totalProfit}
								/>
							</div>
						</div>
					</div>
				</TransitionChild>
			</Dialog>
		</Transition>
	);
}
