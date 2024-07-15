import {Fragment, memo, type ReactElement, useCallback, useMemo} from 'react';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, formatAmount} from '@builtbymom/web3/utils';
import {Dialog, Transition, TransitionChild} from '@headlessui/react';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {useSolver} from '@lib/contexts/useSolver';
import {useIsZapNeeded} from '@lib/hooks/useIsZapNeeded';

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
};

export const DepositModal = memo(function DepositModal(props: TDepositModalProps): ReactElement {
	const {address} = useWeb3();
	const {configuration, dispatchConfiguration} = useManageVaults();
	const {isZapNeededForDeposit} = useIsZapNeeded(configuration);

	const getButtonTitle = (): string => {
		if (!address) {
			return 'Connect wallet';
		}
		if (isApproved) {
			return 'Deposit';
		}

		return 'Approve';
	};

	const {
		onApprove,
		isApproved,
		isFetchingAllowance,
		approvalStatus,
		onExecuteDeposit,
		depositStatus,
		isFetchingQuote,
		quote
	} = useSolver();

	const onAction = useCallback(async () => {
		if (isApproved) {
			return onExecuteDeposit(() => {
				props.onClose();
				props.set_isSuccessModalOpen(true);
				props.set_successModalDescription(
					<div>
						<p className={'text-regularText/50'}>{'Successfully deposited'}</p>
						{formatAmount(
							Number(configuration?.tokenToSpend?.amount?.normalized),
							configuration?.tokenToSpend?.token?.decimals,
							3
						)}{' '}
						<p className={'ml-1'}>{configuration?.tokenToSpend?.token?.symbol}</p>
						<p className={'text-regularText/50'}>{'to'}</p>
						<p className={'text-regularText/50'}>{configuration?.vault?.name}</p>
					</div>
				);
			});
		}
		return onApprove();
	}, [
		configuration?.tokenToSpend?.amount?.normalized,
		configuration?.tokenToSpend?.token?.decimals,
		configuration?.tokenToSpend?.token?.symbol,
		configuration?.vault?.name,
		isApproved,
		onApprove,
		onExecuteDeposit,
		props
	]);

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
								<p className={'text-lg font-bold'}>{'Receive'}</p>
							</div>

							<VaultLink
								vault={props.vault}
								yearnfiLink={props.yearnfiLink}
							/>
							<div className={'flex w-full flex-col items-start gap-y-1'}>
								<TokenAmountWrapper
									vault={props.vault}
									buttonTitle={getButtonTitle()}
									isPerformingAction={
										isFetchingAllowance ||
										approvalStatus.pending ||
										depositStatus.pending ||
										isFetchingQuote
									}
									onActionClick={onAction}
									isDisabled={!isValid}
									set_tokenToUse={(token, amount) =>
										dispatchConfiguration({type: 'SET_TOKEN_TO_SPEND', payload: {token, amount}})
									}
								/>
							</div>
						</div>
					</div>
				</TransitionChild>
			</Dialog>
		</Transition>
	);
});
