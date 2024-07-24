import {Fragment, type ReactElement, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import InputNumber from 'rc-input-number';
import {useOnClickOutside} from 'usehooks-ts';
import {serialize} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, fromNormalized, isAddress, toAddress, toBigInt, toNormalizedBN} from '@builtbymom/web3/utils';
import {formatBigIntForDisplay} from '@generationsoftware/hyperstructure-client-js';
import {Dialog, Transition, TransitionChild} from '@headlessui/react';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {usePopularTokens} from '@lib/contexts/usePopularTokens';
import {useSolver} from '@lib/contexts/useSolver';
import {useIsZapNeeded} from '@lib/hooks/useIsZapNeeded';
import {createUniqueID} from '@lib/utils/tools.identifiers';

import {IconChevron} from '../icons/IconChevron';
import {IconCross} from '../icons/IconCross';
import {IconSpinner} from '../icons/IconSpinner';
import {Button} from './Button';
import {ImageWithFallback} from './ImageWithFallback';
import {TokenSelectorDropdown} from './TokenSelectorDropdown';
import {VaultLink} from './VaultLink';

import type {TToken} from '@builtbymom/web3/types';
import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';

type TWithdrawModalProps = {
	isOpen: boolean;
	onClose: () => void;
	vault: TYDaemonVault;
	yearnfiLink: string;
	hasBalanceForVault: boolean;
	set_isSuccessModalOpen: (value: boolean) => void;
	set_successModalDescription: (value: ReactElement) => void;
};

function WithdrawModalContent(props: TWithdrawModalProps): ReactElement {
	const {address, onConnect} = useWeb3();
	const {configuration, dispatchConfiguration} = useManageVaults();
	const [isSelectorOpen, set_isSelectorOpen] = useState(false);
	const [searchValue, set_searchValue] = useState('');
	const [allAvailableTokens, set_allAvailableTokens] = useState<TToken[]>([]);
	const {listTokens} = usePopularTokens();
	const selectorRef = useRef(null);
	const toggleButtonRef = useRef(null);
	const tokensOnCurrentChain = listTokens(configuration?.vault?.chainID);
	const {isZapNeededForWithdraw} = useIsZapNeeded(configuration);
	const {onExecuteWithdraw, quote, isFetchingQuote, withdrawStatus, canZap, onApprove, isApproved, approvalStatus} =
		useSolver();
	const {balances, getBalance} = useWallet();

	useOnClickOutside([selectorRef, toggleButtonRef], () => set_isSelectorOpen(false));

	/**********************************************************************************************
	 ** Balances is an object with multiple level of depth. We want to create a unique hash from
	 ** it to know when it changes. This new hash will be used to trigger the useEffect hook.
	 ** We will use classic hash function to create a hash from the balances object.
	 *********************************************************************************************/
	const currentBalanceIdentifier = useMemo(() => {
		const hash = createUniqueID(serialize(balances));
		return hash;
	}, [balances]);

	/**********************************************************************************************
	 ** useMemo hook to create a vault token object based on the current configuration.
	 ** - If the configuration does not contain a vault token, it returns `undefined`.
	 ** - Otherwise, it returns a new token object with additional properties such as `chainID`,
	 ** `value`, and `balance`.
	 *********************************************************************************************/
	const vaultToken = useMemo((): TToken | undefined => {
		if (!configuration?.vault?.token) {
			return undefined;
		}
		return {
			...configuration.vault.token,
			chainID: configuration.vault.chainID,
			value: 0,
			balance: getBalance({
				chainID: configuration.vault.chainID,
				address: toAddress(configuration.vault.token.address)
			})
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [configuration?.vault?.chainID, configuration?.vault?.token, currentBalanceIdentifier]);

	/**********************************************************************************************
	 ** useEffect hook to set the list of all available tokens when certain conditions are met.
	 ** - If `vaultToken` is not present, the effect returns early.
	 ** - If `allAvailableTokens` already has tokens, the effect returns early.
	 ** - Otherwise, it sets `allAvailableTokens` to a new list containing `vaultToken`
	 ** followed by `tokensOnCurrentChain`.
	 *********************************************************************************************/
	useEffect((): void => {
		if (!vaultToken) {
			return;
		}
		if (allAvailableTokens.length > 0) {
			return;
		}
		set_allAvailableTokens([vaultToken, ...tokensOnCurrentChain]);
	}, [tokensOnCurrentChain, vaultToken, allAvailableTokens]);

	/**********************************************************************************************
	 ** useMemo hook to filter and deduplicate a list of tokens based on a search value.
	 ** - Clones the list of all available tokens and removes duplicates.
	 ** - Filters the tokens based on whether the token's name or symbol includes the search value.
	 ** - Removes any remaining duplicates based on the token's address
	 *********************************************************************************************/
	const searchFilteredTokens = useMemo((): TToken[] => {
		const cloned = [...new Set(allAvailableTokens)];
		const filtered = cloned.filter(token => {
			const lowercaseValue = searchValue.toLowerCase();
			return (
				token.name.toLowerCase().includes(lowercaseValue) || token.symbol.toLowerCase().includes(lowercaseValue)
			);
		});
		const noDuplicates: TToken[] = [];
		for (const token of filtered) {
			if (!noDuplicates.some(t => t.address === token.address)) {
				noDuplicates.push(token);
			}
		}
		return noDuplicates;
	}, [allAvailableTokens, searchValue]);

	/**********************************************************************************************
	 ** onAction is a callback that decides what to do on button click. If wallet isn't connected,
	 ** button opens Wallet connect modal. If wallet's connected, but token isn't approved, is
	 ** calls approve contract. And if everything's ready, it calls onExecuteWithdraw function,
	 ** and if everything is successfull, we close withdraw modal and open successModal.
	 *********************************************************************************************/
	const onAction = useCallback(async () => {
		if (!isAddress(address)) {
			onConnect();
			return;
		}
		if (!isApproved && isZapNeededForWithdraw) {
			onApprove?.();
			return;
		}
		return onExecuteWithdraw?.(() => {
			props.onClose();
			props.set_isSuccessModalOpen(true);
			props.set_successModalDescription(
				<div className={'flex flex-col items-center'}>
					<p className={'text-regularText/50 whitespace-nowrap'}>{'Successfully withdrawn'}</p>

					<div className={'flex flex-col items-center'}>
						<div className={'flex'}>
							{!isZapNeededForWithdraw
								? configuration?.tokenToSpend.amount?.display.slice(0, 7)
								: formatBigIntForDisplay(
										BigInt(quote?.minOutputAmount ?? ''),
										quote?.outputTokenDecimals ?? 18,
										{maximumFractionDigits: 6}
									)}
							<p className={'ml-1'}>{configuration?.tokenToReceive?.token?.symbol}</p>
						</div>
						<span className={'text-regularText/50'}>
							<span className={'mx-1'}>{'to your wallet'}</span>
						</span>
					</div>
				</div>
			);
		});
	}, [
		address,
		configuration?.tokenToReceive?.token?.symbol,
		configuration?.tokenToSpend.amount?.display,
		isApproved,
		isZapNeededForWithdraw,
		onApprove,
		onConnect,
		onExecuteWithdraw,
		props,
		quote?.minOutputAmount,
		quote?.outputTokenDecimals
	]);

	/**********************************************************************************************
	 ** Retrieve the user's balance for the current vault. We will use the getBalance function
	 ** from the useWallet hook to retrieve the balance. We are using currentBalanceIdentifier as a
	 ** dependency to trigger the useEffect hook when the balances object changes.
	 *********************************************************************************************/
	const balance = useMemo(() => {
		currentBalanceIdentifier;
		const value =
			getBalance({
				address: toAddress(configuration?.vault?.address),
				chainID: Number(configuration?.vault?.chainID)
			}).normalized || 0;
		return value;
	}, [getBalance, configuration?.vault?.address, configuration?.vault?.chainID, currentBalanceIdentifier]);

	/**********************************************************************************************
	 ** buttonTitle for withdraw only button depends - on wallet(if wallet isn't connected, button
	 ** says 'Connect Wallet'), - on possibility of withdraw from portals (if it's not possible,
	 ** but says it), - on isApproved(if token to withdraw isn't approve, button says 'Approve'),
	 ** And if everything is ready for withdraw, it says 'Withdraw'.
	 *********************************************************************************************/
	const buttonTitle = useMemo(() => {
		if (!isAddress(address)) {
			return 'Connect Wallet';
		}
		if (!canZap && !isFetchingQuote) {
			return 'Impossible to zap out';
		}
		if (!isApproved && isZapNeededForWithdraw) {
			return 'Approve';
		}
		return 'Withdraw';
	}, [address, canZap, isFetchingQuote, isApproved, isZapNeededForWithdraw]);

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
					<div className={cl('fixed -translate-y-1/3 top-1/3 p-4 text-center sm:items-center sm:p-0')}>
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
											value={configuration?.tokenToSpend?.amount?.normalized}
											onChange={value => {
												const decimals = configuration?.tokenToSpend.token?.decimals;

												dispatchConfiguration({
													type: 'SET_TOKEN_TO_SPEND',
													payload: {
														amount: toNormalizedBN(
															fromNormalized(value ?? '', decimals),
															decimals ?? 18
														)
													}
												});
											}}
										/>
									</div>
									<button
										onClick={() =>
											dispatchConfiguration({
												type: 'SET_TOKEN_TO_SPEND',
												payload: {
													amount: toNormalizedBN(
														fromNormalized(
															balance,
															configuration?.tokenToSpend?.token?.decimals
														),
														configuration?.tokenToSpend?.token?.decimals ?? 18
													)
												}
											})
										}
										disabled={false}
										className={
											'border-regularText/15 bg-regularText/5 text-regularText rounded-lg border p-2 disabled:cursor-not-allowed'
										}>
										{'Max'}
									</button>
								</label>
							</div>
							<div className={'mt-1 flex w-full justify-start'}>
								<button
									onClick={() =>
										dispatchConfiguration({
											type: 'SET_TOKEN_TO_SPEND',
											payload: {
												amount: toNormalizedBN(
													fromNormalized(
														balance,
														configuration?.tokenToSpend?.token?.decimals
													),
													configuration?.tokenToSpend?.token?.decimals ?? 18
												)
											}
										})
									}
									className={'text-regularText text-right text-xs text-opacity-40'}>
									{`Available: ${balance} ${configuration?.vault?.token.symbol}`}
								</button>
							</div>
							<div className={'mb-4 mt-10 flex w-full justify-start'}>
								<p className={'text-lg font-bold'}>{'Receive'}</p>
							</div>

							<div className={'mb-5'}>
								<div className={'w-full'}>
									<Button
										isBusy={false}
										isDisabled={!address}
										ref={toggleButtonRef}
										onClick={() => set_isSelectorOpen(prev => !prev)}
										className={
											'border-regularText/15 bg-regularText/5 relative flex !h-16 w-full items-center justify-between gap-x-1 rounded-lg border px-4 py-3 disabled:cursor-not-allowed'
										}>
										<div className={'flex w-full items-center gap-x-2'}>
											<ImageWithFallback
												src={`https://assets.smold.app/tokens/${configuration?.vault?.chainID}/${configuration?.tokenToReceive.token?.address}/logo-128.png`}
												alt={configuration?.tokenToReceive.token?.address || 'address'}
												width={32}
												height={32}
												className={
													(!canZap && !isFetchingQuote) ||
													toBigInt(configuration?.tokenToSpend.amount?.raw) === 0n
														? 'opacity-40'
														: ''
												}
											/>
											<div
												className={cl(
													'flex gap-x-1',
													(!canZap && !isFetchingQuote) ||
														toBigInt(configuration?.tokenToSpend.amount?.raw) === 0n
														? 'text-regularText/40'
														: ''
												)}>
												{isFetchingQuote ? (
													<IconSpinner className={'text-accentText size-4 animate-spin'} />
												) : (
													<>
														<span>
															{!isZapNeededForWithdraw
																? configuration?.tokenToSpend.amount?.normalized
																: formatBigIntForDisplay(
																		BigInt(quote?.minOutputAmount ?? ''),
																		quote?.outputTokenDecimals ?? 18,
																		{maximumFractionDigits: 10}
																	)}
														</span>
														<span>{configuration?.tokenToReceive.token?.symbol}</span>
													</>
												)}
											</div>
										</div>
										<IconChevron className={'text-regularText size-6'} />
									</Button>
								</div>

								<TokenSelectorDropdown
									isOpen={isSelectorOpen}
									set_isOpen={set_isSelectorOpen}
									set_tokenToUse={token =>
										dispatchConfiguration({
											type: 'SET_TOKEN_TO_RECEIVE',
											payload: {
												token,
												amount: toNormalizedBN(
													BigInt(quote?.minOutputAmount ?? ''),
													quote?.outputTokenDecimals ?? 18
												)
											}
										})
									}
									searchValue={searchValue}
									set_searchValue={set_searchValue}
									tokens={searchFilteredTokens}
									selectorRef={selectorRef}
								/>
							</div>

							<Button
								onClick={onAction}
								isBusy={isFetchingQuote || withdrawStatus?.pending || approvalStatus?.pending}
								isDisabled={false}
								spinnerClassName={'text-background size-4 animate-spin'}
								className={cl(
									'text-background flex w-full justify-center regularTextspace-nowrap rounded-lg bg-regularText md:px-[34.5px] py-5 font-bold',
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

export function WithdrawModal(props: TWithdrawModalProps): ReactElement {
	if (!props.isOpen) {
		return <Fragment />;
	}
	return <WithdrawModalContent {...props} />;
}
