import {Fragment, useCallback, useEffect, useMemo, useState} from 'react';
import {usePlausible} from 'next-plausible';
import {useWaitForTransactionReceipt, useWriteContract} from 'wagmi';
import {motion} from 'framer-motion';
import {ModalWrapper} from '@lib/components/common/ModalWrapper';
import {VaultLink} from '@lib/components/common/VaultLink';
import {IconCross} from '@lib/components/icons/IconCross';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {useSolver} from '@lib/contexts/useSolver';
import useWallet from '@lib/contexts/useWallet';
import {useWeb3} from '@lib/contexts/useWeb3';
import {toBigInt, zeroNormalizedBN} from '@lib/utils';
import {weth9Abi} from '@lib/utils/abi/weth9.abi';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {useAccountModal} from '@rainbow-me/rainbowkit';

import {WETHTokenAmountInput} from './WETHTokenAmountInput';

import type {Dispatch, ReactElement, SetStateAction} from 'react';
import type {TSuccessModal} from '@lib/components/common/VaultItem';
import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';

const WETH_ADDRESS = '0xEE7D8BCFb72bC1880D0Cf19822eB0A2e6577aB62';

type TWETHDepositModalProps = {
	isOpen: boolean;
	onClose: () => void;
	vault: TYDaemonVault;
	yearnfiLink: string;
	hasBalanceForVault: boolean;
	openSuccessModal: Dispatch<SetStateAction<TSuccessModal>>;
	apy: number;
	totalProfit?: string;
};

export function WETHDepositModalContent(props: TWETHDepositModalProps): ReactElement {
	const plausible = usePlausible();
	const {address, isWalletSafe} = useWeb3();
	const {openAccountModal} = useAccountModal();
	const {configuration, dispatchConfiguration} = useManageVaults();
	const {onRefresh} = useWallet();
	const [isWrapping, set_isWrapping] = useState(false);
	const [processedWrapHash, set_processedWrapHash] = useState<string | null>(null);
	const {canZap, onApprove, isApproving, isDepositing, onDeposit, canDeposit, isFetchingQuote, isApproved} = useSolver();


	// Check if token to spend is ETH
	const isETHSelected = useMemo(() => {
		return configuration?.tokenToSpend?.token?.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
	}, [configuration?.tokenToSpend?.token?.address]);

	// Write contract for wrapping ETH
	const {data: wrapHash, writeContract: wrapETH} = useWriteContract();

	// Wait for wrap transaction
	const {isLoading: isWrapPending} = useWaitForTransactionReceipt({
		hash: wrapHash,
		chainId: props.vault.chainID
	});

	/**********************************************************************************************
	 ** buttonTitle for deposit only button depends on wallet connection, wrapping state, and approval
	 *********************************************************************************************/
	const getButtonTitle = useMemo((): string => {
		if (!address) {
			return 'Connect Wallet';
		}
		if (isETHSelected) {
			return 'Wrap ETH';
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
	}, [address, isETHSelected, canDeposit, isWalletSafe, isFetchingQuote, canZap]);

	const isBusy = !configuration?.tokenToSpend.amount?.normalized
		? false
		: Boolean(isApproving || isDepositing || isWrapping || isWrapPending);

	/**********************************************************************************************
	 ** Handle wrapping ETH to WETH as a standalone transaction
	 *********************************************************************************************/
	const handleWrapETH = useCallback(async () => {
		if (!configuration?.tokenToSpend?.amount?.raw) {
return;
}

		set_isWrapping(true);
		try {
			// Wrap ETH to WETH
			wrapETH({
				address: WETH_ADDRESS,
				abi: weth9Abi,
				functionName: 'deposit',
				value: toBigInt(configuration.tokenToSpend.amount.raw),
				chainId: props.vault.chainID
			});
		} catch (error) {
			console.error('Error wrapping ETH:', error);
			set_isWrapping(false);
		}
	}, [configuration?.tokenToSpend?.amount?.raw, props.vault.chainID, wrapETH]);

	// Watch for wrap transaction completion
	useEffect(() => {
		// Only process if we have a new wrap hash that we haven't processed yet
		if (wrapHash && !isWrapPending && isWrapping && wrapHash !== processedWrapHash) {
			// Mark this hash as processed immediately to prevent re-runs
			set_processedWrapHash(wrapHash);

			// Transaction confirmed, switch to WETH
			(async () => {
				try {
					// Update the token to WETH
					dispatchConfiguration({
						type: 'SET_TOKEN_TO_SPEND',
						payload: {
							token: {
								address: WETH_ADDRESS,
								name: 'Wrapped Ether',
								symbol: 'vbETH',
								decimals: 18,
								chainID: props.vault.chainID,
								value: 0
							},
							amount: configuration?.tokenToSpend?.amount || zeroNormalizedBN
						}
					});

					// Refresh balances
					await onRefresh([{chainID: props.vault.chainID, address: WETH_ADDRESS}]);
				} catch (error) {
					console.error('Error during wrap completion:', error);
				} finally {
					set_isWrapping(false);
				}
			})();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [wrapHash, isWrapPending, isWrapping, processedWrapHash]);

	/**********************************************************************************************
	 ** onAction is a callback that decides what to do on button click
	 *********************************************************************************************/
	const onAction = useCallback(async () => {
		if (!address) {
			openAccountModal?.();
			return;
		}

		if (isETHSelected) {
			await handleWrapETH();
			return;
		}

		if (canDeposit) {
			const isSuccess = await onDeposit();
			if (isSuccess) {
				plausible(PLAUSIBLE_EVENTS.DEPOSIT, {
					props: {
						vaultAddress: props.vault.address,
						vaultSymbol: props.vault.symbol,
						amountToDeposit: configuration.tokenToSpend.amount?.display,
						tokenAddress: configuration.tokenToSpend.token?.address,
						tokenSymbol: configuration.tokenToSpend.token?.symbol,
						isZap: false
					}
				});
				props.onClose();
				props.openSuccessModal({
					isOpen: true,
					description: (
						<div className={'flex flex-col items-center'}>
							<p className={'text-regularText/50 whitespace-nowrap'}>{'Successfully deposited'}</p>

							<div className={'flex'}>
								{configuration?.tokenToSpend.amount?.display.slice(0, 7)}
								<p className={'ml-1'}>{configuration?.tokenToSpend?.token?.symbol}</p>
								<span className={'text-regularText/50'}>
									<span className={'mx-1'}>{'to'}</span>
									{configuration?.vault?.name}
								</span>
							</div>
						</div>
					)
				});
			}
		} else {
			onApprove();
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		address,
		isETHSelected,
		canDeposit,
		configuration?.tokenToSpend.amount?.display,
		configuration?.tokenToSpend.amount?.raw,
		configuration?.tokenToSpend.token?.decimals,
		configuration?.tokenToSpend.token?.symbol,
		configuration?.vault?.name,
		onApprove,
		onDeposit,
		openAccountModal
	]);

	/**********************************************************************************************
	 ** Validity check including ETH balance check
	 *********************************************************************************************/
	const isValid = useMemo((): boolean => {
		if (isETHSelected) {
			// Check if user has enough ETH - balance check is handled in WETHTokenAmountInput
			const ethAmount = configuration?.tokenToSpend?.amount?.raw || 0n;
			return ethAmount > 0n;
		}

		if (!configuration?.tokenToSpend.amount || !configuration?.tokenToSpend.token) {
			return false;
		}

		if (configuration?.tokenToSpend.token.address === configuration?.vault?.address) {
			return false;
		}

		return true;
	}, [
		isETHSelected,
		configuration
	]);

	/**********************************************************************************************
	 ** Set initial vault configuration and reset state when modal opens
	 *********************************************************************************************/
	useEffect(() => {
		if (props.isOpen) {
			// Reset state when modal opens
			set_processedWrapHash(null);
			set_isWrapping(false);

			dispatchConfiguration({
				type: 'SET_DEPOSIT',
				payload: {
					vault: props.vault,
					toSpend: {
						token: undefined, // Let the token selector decide the default
						amount: zeroNormalizedBN
					}
				}
			});
		}
	}, [dispatchConfiguration, props.vault, props.isOpen]);

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
					<WETHTokenAmountInput
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

export function WETHDepositModal(props: TWETHDepositModalProps): ReactElement {
	if (!props.isOpen) {
		return <Fragment />;
	}
	return <WETHDepositModalContent {...props} />;
}
