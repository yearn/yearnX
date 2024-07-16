import {Fragment, type ReactElement, useCallback, useMemo, useRef, useState} from 'react';
import InputNumber from 'rc-input-number';
import {useOnClickOutside} from 'usehooks-ts';
import {serialize} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, fromNormalized, toAddress, toNormalizedBN} from '@builtbymom/web3/utils';
import {formatBigIntForDisplay} from '@generationsoftware/hyperstructure-client-js';
import {Dialog, Transition, TransitionChild} from '@headlessui/react';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {useSolver} from '@lib/contexts/useSolver';
import {useIsZapNeeded} from '@lib/hooks/useIsZapNeeded';
import {useTokensWithBalance} from '@lib/hooks/useTokensWithBalance';
import {createUniqueID} from '@lib/utils/tools.identifiers';

import {IconChevron} from '../icons/IconChevron';
import {IconCross} from '../icons/IconCross';
import {IconSpinner} from '../icons/IconSpinner';
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
	set_isSuccessModalOpen: (value: boolean) => void;
	set_successModalDescription: (value: ReactElement) => void;
};

export function WithdrawModal(props: TWithdrawModalProps): ReactElement {
	const {address} = useWeb3();
	const {configuration, dispatchConfiguration} = useManageVaults();
	const [isSelectorOpen, set_isSelectorOpen] = useState(false);
	const [searchValue, set_searchValue] = useState('');
	const {listTokens} = useTokensWithBalance();
	const selectorRef = useRef(null);
	const toggleButtonRef = useRef(null);

	useOnClickOutside([selectorRef, toggleButtonRef], () => set_isSelectorOpen(false));

	const tokensOnCurrentChain = listTokens(configuration?.vault?.chainID);

	const searchFilteredTokens = tokensOnCurrentChain.filter(token => {
		const lowercaseValue = searchValue.toLowerCase();
		return token.name.toLowerCase().includes(lowercaseValue) || token.symbol.toLowerCase().includes(lowercaseValue);
	});

	const {isZapNeededForWithdraw} = useIsZapNeeded(configuration);

	const {onExecuteWithdraw, quote, isFetchingQuote} = useSolver();
	const {balances, getBalance} = useWallet();

	const onAction = useCallback(async () => {
		return onExecuteWithdraw?.(() => {
			props.onClose();
			props.set_isSuccessModalOpen(true);
			props.set_successModalDescription(
				<div className={'flex flex-col items-center'}>
					<p className={'text-regularText/50 whitespace-nowrap'}>{'Successfully withdrawn'}</p>

					<div className={'flex flex-col items-center'}>
						{!isZapNeededForWithdraw
							? configuration?.tokenToSpend.amount?.display.slice(0, 7)
							: formatBigIntForDisplay(
									BigInt(quote?.minOutputAmount ?? ''),
									quote?.outputTokenDecimals ?? 18,
									{maximumFractionDigits: 6}
								)}
						<p className={'ml-1'}>{configuration?.tokenToReceive?.token?.symbol}</p>
						<span className={'text-regularText/50'}>
							<span className={'mx-1'}>{'to your wallet'}</span>
						</span>
					</div>
				</div>
			);
		});
	}, [
		configuration?.tokenToReceive?.token?.symbol,
		configuration?.tokenToSpend.amount?.display,
		isZapNeededForWithdraw,
		onExecuteWithdraw,
		props,
		quote?.minOutputAmount,
		quote?.outputTokenDecimals
	]);
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
											{isFetchingQuote ? (
												<IconSpinner />
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
								</button>

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
