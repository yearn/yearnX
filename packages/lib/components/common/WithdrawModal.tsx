import {Fragment, type ReactElement, useCallback, useState} from 'react';
import Link from 'next/link';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, toAddress, toBigInt} from '@builtbymom/web3/utils';
import {defaultTxStatus, getNetwork, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {Dialog, Transition, TransitionChild} from '@headlessui/react';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {redeemV3Shares, withdrawShares} from '@lib/utils/actions';
import {VAULT_ABI} from '@lib/utils/vault.abi';
import {readContract} from '@wagmi/core';

import {IconCross} from '../icons/IconCross';
import {IconExternalLink} from '../icons/IconExternalLink';
import {ImageWithFallback} from './ImageWithFallback';
import {TokenAmountWrapper} from './TokenAmountInput';

import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';

type TWithdrawModalProps = {
	isOpen: boolean;
	onClose: () => void;
	vault: TYDaemonVault;
	yearnfiLink: string;
	hasBalanceForVault: boolean;
};

export function WithdrawModal(props: TWithdrawModalProps): ReactElement {
	const {provider} = useWeb3();
	const {onRefresh} = useWallet();
	const {configuration, dispatchConfiguration} = useManageVaults();
	const [actionStatus, set_actionStatus] = useState(defaultTxStatus);

	const onWithdraw = useCallback(async () => {
		if (configuration.tokenToSpend.token?.address === props.vault.address) {
			const pricePerShare = await readContract(retrieveConfig(), {
				abi: VAULT_ABI,
				address: props.vault.address,
				functionName: 'pricePerShare',
				chainId: props.vault.chainID
			});
			const shareValue = toBigInt(configuration.tokenToSpend.amount?.raw) / toBigInt(pricePerShare);
			if (props.vault.version.startsWith('3')) {
				const result = await redeemV3Shares({
					connector: provider,
					chainID: props.vault.chainID,
					contractAddress: toAddress(props.vault.address),
					amount: shareValue,
					statusHandler: set_actionStatus
				});
				if (result.isSuccessful) {
					await onRefresh([
						{chainID: props.vault.chainID, address: props.vault.address},
						{chainID: props.vault.chainID, address: props.vault.token.address}
					]);
					dispatchConfiguration({type: 'SET_TOKEN_TO_SPEND', payload: {amount: undefined}});
					props.onClose();
				}
			} else {
				const result = await withdrawShares({
					connector: provider,
					chainID: props.vault.chainID,
					contractAddress: toAddress(props.vault.address),
					amount: shareValue,
					statusHandler: set_actionStatus
				});
				if (result.isSuccessful) {
					await onRefresh([
						{chainID: props.vault.chainID, address: props.vault.address},
						{chainID: props.vault.chainID, address: props.vault.token.address}
					]);
					dispatchConfiguration({type: 'SET_TOKEN_TO_SPEND', payload: {amount: undefined}});
					props.onClose();
				}
			}
		} else if (configuration.tokenToSpend.token?.address === props.vault.token.address) {
			throw new Error('CANNOT WITHDRAW THE TOKEN ITSELF');
		} else {
			throw new Error('PORTALS SUPPORT TODO');
		}
	}, [
		configuration?.tokenToSpend.token?.address,
		configuration?.tokenToSpend.amount?.raw,
		props,
		provider,
		onRefresh,
		dispatchConfiguration
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
								<IconCross className={'size-4'} />
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
										<p className={'md:regularTextspace-nowrap w-full text-left'}>
											{props.vault.name}
										</p>
										<IconExternalLink className={'size-4'} />
									</div>

									<p className={'text-regularText/50 flex w-full justify-start'}>
										{getNetwork(props.vault.chainID).name}
									</p>
								</div>
							</Link>
							<div className={'mt-4 flex w-full flex-col items-start gap-y-1'}>
								<TokenAmountWrapper
									vault={props.vault}
									label={'Withdraw'}
									buttonTitle={'Withdraw'}
									onActionClick={onWithdraw}
									isPerformingAction={actionStatus.pending}
									isDisabled={false}
								/>
							</div>
						</div>
					</div>
				</TransitionChild>
			</Dialog>
		</Transition>
	);
}
