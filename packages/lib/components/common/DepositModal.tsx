import {Fragment, type ReactElement} from 'react';
import Link from 'next/link';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {getNetwork} from '@builtbymom/web3/utils/wagmi';
import {Dialog, Transition, TransitionChild} from '@headlessui/react';

import {IconCross} from '../icons/IconCross';
import {IconExternalLink} from '../icons/IconExternalLink';
import {ImageWithFallback} from './ImageWithFallback';
import {TokenAmountWrapper} from './TokenAmountInput';

import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';

type TDepositModalProps = {
	isOpen: boolean;
	onClose: (val: boolean) => void;
	vault: TYDaemonVault;
	yearnfiLink: string;
	hasBalanceForVault: boolean;
};

export function DepositModal(props: TDepositModalProps): ReactElement {
	const {address} = useWeb3();
	return (
		<Transition
			show={props.isOpen}
			as={Fragment}>
			<Dialog
				as={'div'}
				className={'relative z-[1000]'}
				onClose={props.onClose}>
				<TransitionChild
					as={Fragment}
					enter={'ease-out duration-300'}
					enterFrom={'opacity-0'}
					enterTo={'opacity-100'}
					leave={'ease-in duration-200'}
					leaveFrom={'opacity-100'}
					leaveTo={'opacity-0'}>
					<div className={'bg-primary-900/40 fixed inset-0 backdrop-blur-sm transition-opacity'} />
				</TransitionChild>

				<div className={'fixed inset-0 z-[1001] w-screen overflow-y-auto'}>
					<div className={'flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'}>
						<div className={'bg-background relative rounded-2xl p-10 md:min-w-[640px]'}>
							<button
								onClick={() => props.onClose(false)}
								className={'absolute right-5 top-5'}>
								<IconCross className={'size-4'} />
							</button>

							<Link
								href={props.yearnfiLink}
								target={'_blank'}
								className={
									'mb-8 flex w-min items-center rounded-xl border border-white/15 bg-white/5 px-2.5 py-2'
								}>
								<ImageWithFallback
									src={`https://assets.smold.app/tokens/${props.vault.chainID}/${props.vault.token.address}/logo-32.png`}
									alt={props.vault.token.symbol}
									width={28}
									height={28}
								/>
								<div className={'ml-2 flex flex-col'}>
									<div className={'flex items-center gap-x-2'}>
										<p className={'w-full md:whitespace-nowrap'}>{props.vault.name}</p>
										<IconExternalLink className={'size-4'} />
									</div>

									<p className={'flex w-full justify-start text-white/50'}>
										{getNetwork(props.vault.chainID).name}
									</p>
								</div>
							</Link>
							<div className={'mb-8 flex w-full flex-col items-start gap-y-1'}>
								<TokenAmountWrapper
									vault={props.vault}
									label={'Deposit'}
								/>
							</div>
							{address && props.hasBalanceForVault && (
								<div className={'mt-4 flex w-full flex-col items-start gap-y-1'}>
									<TokenAmountWrapper
										vault={props.vault}
										label={'Withdraw'}
									/>
								</div>
							)}
						</div>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
}
