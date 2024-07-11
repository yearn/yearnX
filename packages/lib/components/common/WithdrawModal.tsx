import {Fragment, type ReactElement, useMemo, useRef, useState} from 'react';
import InputNumber from 'rc-input-number';
import {useOnClickOutside} from 'usehooks-ts';
// import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, formatLocalAmount, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {Dialog, Transition, TransitionChild} from '@headlessui/react';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {useTokensWithBalance} from '@lib/hooks/useTokensWithBalance';

import {IconChevron} from '../icons/IconChevron';
import {IconCross} from '../icons/IconCross';
import {Button} from './Button';
import {ImageWithFallback} from './ImageWithFallback';
import {TokenSelectorDropdown} from './TokenSelectorDropdown';
import {VaultLink} from './VaultLink';

import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';

type TWithdrawModalProps = {
	isOpen: boolean;
	onClose: () => void;
	vault: TYDaemonVault;
	yearnfiLink: string;
	hasBalanceForVault: boolean;
};

export function WithdrawModal(props: TWithdrawModalProps): ReactElement {
	const {address} = useWeb3();
	// const {onRefresh} = useWallet();
	const {configuration, dispatchConfiguration} = useManageVaults();
	// const [actionStatus, set_actionStatus] = useState(defaultTxStatus);
	const selectorRef = useRef(null);

	const toggleButtonRef = useRef(null);

	useOnClickOutside([selectorRef, toggleButtonRef], () => set_isSelectorOpen(false));

	const [isSelectorOpen, set_isSelectorOpen] = useState(false);

	const [searchValue, set_searchValue] = useState('');

	const {listTokens} = useTokensWithBalance();
	const tokensOnCurrentChain = listTokens(configuration?.vault?.chainID);

	const searchFilteredTokens = tokensOnCurrentChain.filter(token => {
		const lowercaseValue = searchValue.toLowerCase();
		return token.name.toLowerCase().includes(lowercaseValue) || token.symbol.toLowerCase().includes(lowercaseValue);
	});

	// const onWithdraw = useCallback(async () => {
	// 	if (configuration.tokenToSpend.token?.address === props.vault.address) {
	// 		const pricePerShare = await readContract(retrieveConfig(), {
	// 			abi: VAULT_ABI,
	// 			address: props.vault.address,
	// 			functionName: 'pricePerShare',
	// 			chainId: props.vault.chainID
	// 		});
	// 		const shareValue = toBigInt(configuration.tokenToSpend.amount?.raw) / toBigInt(pricePerShare);
	// 		if (props.vault.version.startsWith('3')) {
	// 			const result = await redeemV3Shares({
	// 				connector: provider,
	// 				chainID: props.vault.chainID,
	// 				contractAddress: toAddress(props.vault.address),
	// 				amount: shareValue,
	// 				statusHandler: set_actionStatus
	// 			});
	// 			if (result.isSuccessful) {
	// 				await onRefresh([
	// 					{chainID: props.vault.chainID, address: props.vault.address},
	// 					{chainID: props.vault.chainID, address: props.vault.token.address}
	// 				]);
	// 				dispatchConfiguration({type: 'SET_TOKEN_TO_SPEND', payload: {amount: undefined}});
	// 				props.onClose();
	// 			}
	// 		} else {
	// 			const result = await withdrawShares({
	// 				connector: provider,
	// 				chainID: props.vault.chainID,
	// 				contractAddress: toAddress(props.vault.address),
	// 				amount: shareValue,
	// 				statusHandler: set_actionStatus
	// 			});
	// 			if (result.isSuccessful) {
	// 				await onRefresh([
	// 					{chainID: props.vault.chainID, address: props.vault.address},
	// 					{chainID: props.vault.chainID, address: props.vault.token.address}
	// 				]);
	// 				dispatchConfiguration({type: 'SET_TOKEN_TO_SPEND', payload: {amount: undefined}});
	// 				props.onClose();
	// 			}
	// 		}
	// 	} else if (configuration.tokenToSpend.token?.address === props.vault.token.address) {
	// 		throw new Error('CANNOT WITHDRAW THE TOKEN ITSELF');
	// 	} else {
	// 		throw new Error('PORTALS SUPPORT TODO');
	// 	}
	// }, [
	// 	configuration?.tokenToSpend.token?.address,
	// 	configuration?.tokenToSpend.amount?.raw,
	// 	props,
	// 	provider,
	// 	onRefresh,
	// 	dispatchConfiguration
	// ]);

	// const {getBalance} = useWallet();

	/**********************************************************************************************
	 ** The totalDeposits is the total value locked in the vault. We will use the tvl property
	 ** from the vault object and format it using the formatAmount function.
	 *********************************************************************************************/
	const totalDeposits = useMemo(() => {
		return formatLocalAmount(configuration?.vault?.tvl?.tvl || 0, 4, '$', {
			displayDigits: 2,
			maximumFractionDigits: 2,
			minimumFractionDigits: 2,
			shouldCompactValue: true
		});
	}, [configuration?.vault?.tvl?.tvl]);

	const buttonTitle = address ? 'Withdraw' : 'Connect Wallet';

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

							<div className={'mb-4 flex w-full justify-start text-xl'}>
								<p className={'text-lg font-bold'}>{'Withdraw'}</p>
							</div>

							<VaultLink
								vault={props.vault}
								yearnfiLink={props.yearnfiLink}
							/>

							<div className={'flex flex-col gap-y-1'}>
								<label
									className={cl(
										'z-20 !h-16 relative transition-all border border-regularText/15',
										'flex flex-row items-center cursor-text',
										'focus:placeholder:text-regularText/40 placeholder:transition-colors',
										'py-2 px-4 group border-regularText/15 bg-regularText/5 rounded-lg'
									)}>
									<div className={'relative w-full pr-2'}>
										<InputNumber
											prefixCls={cl(
												'w-full h-full focus:border-none p-0 rounded-lg border-none bg-transparent text-xl transition-colors',
												'placeholder:text-regularText/20 focus:placeholder:text-regularText/30',
												'placeholder:transition-colors !h-16 !ring-0 !ring-offset-0'
											)}
											min={0}
											step={0.1}
											decimalSeparator={'.'}
											placeholder={'0.00'}
											controls={false}
											value={configuration?.tokenToSpend.amount?.normalized}
											onChange={() => {}}
										/>
									</div>
									<button
										onClick={() => {}}
										disabled={false}
										className={
											'border-regularText/15 bg-regularText/5 text-regularText rounded-lg border p-2 disabled:cursor-not-allowed'
										}>
										{'Max'}
									</button>
								</label>
							</div>
							<button
								onClick={() =>
									dispatchConfiguration({
										type: 'SET_TOKEN_TO_RECEIVE',
										payload: {
											amount: toNormalizedBN(
												Number(configuration?.vault?.tvl.tvl),
												Number(configuration?.vault?.decimals)
											)
										}
									})
								}
								className={'text-regularText text-right text-xs text-opacity-40'}>
								{`Available: ${totalDeposits} ${configuration?.vault?.name}`}
							</button>

							<div className={'mb-4 flex w-full justify-start'}>
								<p className={'text-lg font-bold'}>{'Receive'}</p>
							</div>

							<div className={'mb-5'}>
								<button
									disabled={!address}
									ref={toggleButtonRef}
									onClick={() => set_isSelectorOpen(prev => !prev)}
									className={
										'border-regularText/15 bg-regularText/5 relative flex !h-16 w-full items-center justify-between gap-x-1 rounded-lg border px-4 py-3 disabled:cursor-not-allowed'
									}>
									<div className={'flex items-center gap-x-2'}>
										<ImageWithFallback
											src={`https://assets.smold.app/tokens/${configuration?.vault?.chainID}/${configuration?.tokenToReceive.token?.address}/logo-128.png`}
											alt={configuration?.tokenToReceive.token?.address || 'address'}
											width={32}
											height={32}
										/>
										<div className={'flex gap-x-1'}>
											<span>{configuration?.tokenToReceive.amount?.display}</span>
											<span>{configuration?.tokenToReceive.token?.symbol}</span>
										</div>
									</div>
									<IconChevron className={'text-regularText size-6'} />
								</button>

								<TokenSelectorDropdown
									isOpen={isSelectorOpen}
									set_isOpen={set_isSelectorOpen}
									set_tokenToUse={value =>
										dispatchConfiguration({
											type: 'SET_TOKEN_TO_RECEIVE',
											payload: {token: value, amount: zeroNormalizedBN}
										})
									}
									searchValue={searchValue}
									set_searchValue={set_searchValue}
									tokens={searchFilteredTokens}
									selectorRef={selectorRef}
								/>
							</div>

							<Button
								onClick={() => {}}
								isBusy={false}
								isDisabled={false}
								className={cl(
									'text-background flex w-full justify-center regularTextspace-nowrap rounded-lg bg-regularText px-[34.5px] py-5 font-bold',
									'disabled:bg-regularText/10 disabled:text-regularText/30 disabled:cursor-not-allowed !h-12'
								)}>
								{buttonTitle}
							</Button>
						</div>
					</div>
				</TransitionChild>
			</Dialog>
		</Transition>
	);
}
