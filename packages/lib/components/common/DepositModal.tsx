import {Fragment, type ReactElement, useCallback, useMemo} from 'react';
import Link from 'next/link';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {cl, ETH_TOKEN_ADDRESS, toAddress} from '@builtbymom/web3/utils';
import {getNetwork} from '@builtbymom/web3/utils/wagmi';
import {Dialog, Transition, TransitionChild} from '@headlessui/react';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {useSolvers} from '@lib/contexts/useSolver';
import {useIsZapNeeded} from '@lib/hooks/useIsZapNeeded';

import {IconCross} from '../icons/IconCross';
import {IconExternalLink} from '../icons/IconExternalLink';
import {ImageWithFallback} from './ImageWithFallback';
import {TokenAmountWrapper} from './TokenAmountInput';

import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';

type TDepositModalProps = {
	isOpen: boolean;
	onClose: () => void;
	vault: TYDaemonVault;
	yearnfiLink: string;
	hasBalanceForVault: boolean;
};

export function DepositModal(props: TDepositModalProps): ReactElement {
	const {address} = useWeb3();
	const {onRefresh} = useWallet();
	const {safeChainID} = useChainID();
	const {configuration} = useManageVaults();

	const getButtonTitle = (): string => {
		if (!address) {
			return 'Connect wallet';
		}
		if (isApproved) {
			return 'Deposit';
		}

		return 'Approve';
	};

	const onRefreshTokens = useCallback(() => {
		const tokensToRefresh = [];
		if (configuration?.tokenToSpend.token) {
			tokensToRefresh.push({
				decimals: configuration?.tokenToSpend.token.decimals,
				name: configuration?.tokenToSpend.token.name,
				symbol: configuration?.tokenToSpend.token.symbol,
				address: toAddress(configuration?.tokenToSpend.token.address),
				chainID: Number(configuration?.tokenToSpend.token.chainID)
			});
		}
		if (configuration?.vault) {
			tokensToRefresh.push({
				decimals: configuration?.vault.decimals,
				name: configuration?.tokenToSpend.token?.name,
				symbol: configuration?.tokenToSpend.token?.symbol,
				address: toAddress(configuration?.tokenToSpend.token?.address),
				chainID: Number(configuration?.tokenToSpend.token?.chainID)
			});
		}

		const currentChainID =
			configuration?.vault?.chainID || configuration?.tokenToSpend.token?.chainID || safeChainID;

		const {nativeCurrency} = getNetwork(Number(currentChainID));
		if (nativeCurrency) {
			tokensToRefresh.push({
				decimals: 18,
				name: nativeCurrency.name,
				symbol: nativeCurrency.symbol,
				address: ETH_TOKEN_ADDRESS,
				chainID: Number(currentChainID)
			});
		}
		onRefresh(tokensToRefresh, false, true);
	}, [configuration?.tokenToSpend.token, configuration?.vault, onRefresh, safeChainID]);

	const {
		onApprove,
		isApproved,
		isFetchingAllowance,
		approvalStatus,

		onExecuteDeposit,
		depositStatus,

		isFetchingQuote,
		quote
	} = useSolvers();

	const isZapNeeded = useIsZapNeeded();

	const onAction = useCallback(async () => {
		if (isZapNeeded) {
			//remove when add portals
			return;
		}
		if (isApproved) {
			return onExecuteDeposit(() => {
				onRefreshTokens();
				props.onClose();
			});
		}
		return onApprove(() => onRefreshTokens());
	}, [isApproved, isZapNeeded, onApprove, onExecuteDeposit, onRefreshTokens, props]);

	const isValid = useMemo((): boolean => {
		if (isZapNeeded && !quote) {
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
		isZapNeeded,
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

							<Link
								href={props.yearnfiLink}
								target={'_blank'}
								className={
									'border-regularText/15 bg-regularText/5 mb-8 flex w-min cursor-alias items-center rounded-xl border px-2.5 py-2'
								}>
								<ImageWithFallback
									src={`https://assets.smold.app/tokens/${props.vault.chainID}/${props.vault.token.address}/logo-32.png`}
									alt={props.vault.token.symbol}
									width={28}
									height={28}
								/>
								<div className={'ml-2 flex w-48 flex-col md:w-80'}>
									<div className={'flex items-center gap-x-2'}>
										<p className={'md:regularTextspace-nowrap w-full truncate text-left'}>
											{props.vault.name}
										</p>
										<IconExternalLink className={'size-4'} />
									</div>

									<p className={'text-regularText/50 flex w-full justify-start'}>
										{getNetwork(props.vault.chainID).name}
									</p>
								</div>
							</Link>
							<div className={'mb-8 flex w-full flex-col items-start gap-y-1'}>
								<TokenAmountWrapper
									vault={props.vault}
									label={'Deposit'}
									buttonTitle={getButtonTitle()}
									isPerformingAction={
										isFetchingAllowance ||
										approvalStatus.pending ||
										depositStatus.pending ||
										isFetchingQuote
									}
									onActionClick={onAction}
									isDisabled={!isValid}
								/>
							</div>
						</div>
					</div>
				</TransitionChild>
			</Dialog>
		</Transition>
	);
}
