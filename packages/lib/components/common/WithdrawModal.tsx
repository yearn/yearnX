import {Fragment, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {usePlausible} from 'next-plausible';
import InputNumber from 'rc-input-number';
import {useOnClickOutside, useTimeout} from 'usehooks-ts';
import {motion} from 'framer-motion';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, fromNormalized, isAddress, toBigInt, toNormalizedBN} from '@builtbymom/web3/utils';
import {formatBigIntForDisplay} from '@generationsoftware/hyperstructure-client-js';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {usePopularTokens} from '@lib/contexts/usePopularTokens';
import {useSolver} from '@lib/contexts/useSolver';
import {useIsZapNeeded} from '@lib/hooks/useIsZapNeeded';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {acknowledge, getDifference} from '@lib/utils/tools';

import {IconChevron} from '../icons/IconChevron';
import {IconCross} from '../icons/IconCross';
import {Button} from './Button';
import {ImageWithFallback} from './ImageWithFallback';
import {ModalWrapper} from './ModalWrapper';
import {TokenSelectorDropdown} from './TokenSelectorDropdown';
import {VaultLink} from './VaultLink';

import type {Dispatch, ReactElement, SetStateAction} from 'react';
import type {TNormalizedBN, TToken} from '@builtbymom/web3/types';
import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';
import type {TSuccessModal} from './VaultItem';

type TWithdrawModalProps = {
	isOpen: boolean;
	onClose: () => void;
	vault: TYDaemonVault;
	yearnfiLink: string;
	hasBalanceForVault: boolean;
	openSuccessModal: Dispatch<SetStateAction<TSuccessModal>>;
};

function InputAmountComponent(props: {isReady: boolean; availableBalance: TNormalizedBN}): ReactElement {
	const {configuration, dispatchConfiguration} = useManageVaults();

	if (!props.isReady) {
		return (
			<Fragment>
				<div className={'flex flex-col gap-y-1'}>
					<label
						className={cl(
							'z-20 !h-16 relative transition-all border border-regularText/15',
							'flex flex-row items-center cursor-text',
							'focus:placeholder:text-regularText/40 placeholder:transition-colors',
							'py-2 px-4 group border-regularText/15 bg-regularText/5 rounded-lg'
						)}>
						<div className={'relative w-full pr-2'}>
							<div className={'bg-regularText/15 h-10 w-2/3 animate-pulse rounded-lg'} />
						</div>
						<button
							disabled
							className={cl(
								'border-regularText/15 bg-regularText/5 text-regularText',
								'cursor-not-allowed rounded-lg border p-2'
							)}>
							{'Max'}
						</button>
					</label>
				</div>
				<div className={'mt-1 flex w-full justify-start'}>
					<button
						disabled
						className={'text-regularText cursor-not-allowed text-right text-xs text-opacity-40'}>
						{'Available: -'}
					</button>
				</div>
			</Fragment>
		);
	}

	return (
		<Fragment>
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
										amount: toNormalizedBN(fromNormalized(value ?? '', decimals), decimals ?? 18)
									}
								});
							}}
						/>
					</div>
					<button
						onClick={() =>
							dispatchConfiguration({type: 'SET_AMOUNT_TO_SPEND', payload: props.availableBalance})
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
						dispatchConfiguration({type: 'SET_AMOUNT_TO_SPEND', payload: props.availableBalance})
					}
					className={'text-regularText text-right text-xs text-opacity-40'}>
					{`Available: ${props.availableBalance.normalized} ${configuration?.vault?.token.symbol}`}
				</button>
			</div>
		</Fragment>
	);
}

function OutputComponent(props: {isReady: boolean; availableBalance: TNormalizedBN}): ReactElement {
	const {address} = useWeb3();
	const {configuration, dispatchConfiguration} = useManageVaults();
	const [isSelectorOpen, set_isSelectorOpen] = useState(false);
	const [searchValue, set_searchValue] = useState('');
	const [allAvailableTokens, set_allAvailableTokens] = useState<TToken[]>([]);
	const {listTokens} = usePopularTokens();
	const selectorRef = useRef(null);
	const toggleButtonRef = useRef(null);
	const tokensOnCurrentChain = listTokens(configuration?.vault?.chainID);
	const {isZapNeededForWithdraw} = useIsZapNeeded(configuration);
	const {quote, isFetchingQuote, canZap} = useSolver();
	const {balanceHash} = useWallet();

	useOnClickOutside([selectorRef, toggleButtonRef], () => set_isSelectorOpen(false));

	/**********************************************************************************************
	 ** useMemo hook to create a vault token object based on the current configuration.
	 ** - If the configuration does not contain a vault token, it returns `undefined`.
	 ** - Otherwise, it returns a new token object with additional properties such as `chainID`,
	 ** `value`, and `balance`.
	 *********************************************************************************************/
	const vaultToken = useMemo((): TToken | undefined => {
		acknowledge(balanceHash);
		if (!configuration?.vault?.token) {
			return undefined;
		}

		return {
			...configuration.vault.token,
			chainID: configuration.vault.chainID,
			value: 0,
			balance: props.availableBalance
		};
	}, [balanceHash, configuration?.vault?.token, configuration?.vault?.chainID, props.availableBalance]);

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
		const popularWithBalance = [];
		const popularWithoutBalance = [];
		for (const token of tokensOnCurrentChain) {
			if (token.balance.raw > 0n) {
				popularWithBalance.push(token);
			} else {
				popularWithoutBalance.push(token);
			}
		}

		const withUnderlyingTokens = [vaultToken, ...popularWithBalance, ...popularWithoutBalance];

		const unique: TToken[] = [];
		for (const item of withUnderlyingTokens) {
			if (!unique.some(token => token.address === item.address && token.chainID === item.chainID)) {
				unique.push(item);
			}
		}

		set_allAvailableTokens(unique);
	}, [tokensOnCurrentChain, vaultToken, allAvailableTokens]);

	/**********************************************************************************************
	 ** useMemo hook to filter and deduplicate a list of tokens based on a search value.
	 ** - Clones the list of all available tokens and removes duplicates.
	 ** - Filters the tokens based on whether the token's name or symbol includes the search value.
	 ** - Removes any remaining duplicates based on the token's address
	 *********************************************************************************************/
	const searchFilteredTokens = useMemo((): TToken[] => {
		const cloned = [...new Set(allAvailableTokens)];
		if (!searchValue) {
			return cloned;
		}
		const searchFor = searchValue.toLowerCase();
		const sorted = cloned
			.map(item => ({
				item,
				exactness: item.name.toLowerCase() === searchFor || item.symbol.toLowerCase() === searchFor ? 1 : 0,
				diffName: getDifference(item.name.toLowerCase(), searchFor),
				diffSymbol: getDifference(item.symbol.toLowerCase(), searchFor)
			}))
			.sort(
				(a, b) =>
					b.exactness - a.exactness || Math.min(a.diffName, a.diffSymbol) - Math.min(b.diffName, b.diffSymbol)
			)
			.map(sortedItem => sortedItem.item);

		return sorted;
	}, [allAvailableTokens, searchValue]);

	/**********************************************************************************************
	 ** isDisabled is a boolean that determines whether the output component is disabled. Mostly
	 ** for styling purposes.
	 *********************************************************************************************/
	const isDisabled = (!canZap && !isFetchingQuote) || toBigInt(configuration?.tokenToSpend.amount?.raw) === 0n;

	return (
		<div className={'mb-5'}>
			<div className={'w-full'}>
				<Button
					isBusy={false}
					isDisabled={!address}
					ref={toggleButtonRef}
					onClick={() => set_isSelectorOpen(prev => !prev)}
					className={cl(
						'relative flex !h-16 w-full items-center justify-between',
						'border-regularText/15 bg-regularText/5 gap-x-1',
						'rounded-lg border px-4 py-3 disabled:cursor-not-allowed'
					)}>
					<div className={'flex w-full items-center gap-x-2'}>
						<ImageWithFallback
							src={`https://assets.smold.app/tokens/${configuration?.vault?.chainID}/${configuration?.tokenToReceive.token?.address}/logo-128.png`}
							alt={configuration?.tokenToReceive.token?.address || 'address'}
							width={32}
							height={32}
							className={isDisabled ? 'opacity-40' : ''}
						/>
						<div className={cl('flex gap-x-1 w-full', isDisabled ? 'text-regularText/40' : '')}>
							{isFetchingQuote || !props.isReady ? (
								<div className={'bg-regularText/15 h-6 w-2/3 animate-pulse rounded-lg'} />
							) : (
								<Fragment>
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
								</Fragment>
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
	);
}

function ButtonComponent(props: {
	isReady: boolean;
	availableBalance: TNormalizedBN;
	onClose: VoidFunction;
	openSuccessModal: Dispatch<SetStateAction<TSuccessModal>>;
}): ReactElement {
	const plausible = usePlausible();
	const {address, onConnect, isWalletSafe} = useWeb3();
	const {configuration} = useManageVaults();
	const {isZapNeededForWithdraw} = useIsZapNeeded(configuration);
	const {onWithdraw, quote, isFetchingQuote, isWithdrawing, canZap, onApprove, isApproved, isApproving} = useSolver();

	/**********************************************************************************************
	 ** onAction is a callback that decides what to do on button click. If wallet isn't connected,
	 ** button opens Wallet connect modal. If wallet's connected, but token isn't approved, is
	 ** calls approve contract. And if everything's ready, it calls onWithdraw function,
	 ** and if everything is successfull, we close withdraw modal and open successModal.
	 *********************************************************************************************/
	const onAction = useCallback(async () => {
		if (!isAddress(address)) {
			onConnect();
			return;
		}
		if (!isApproved && isZapNeededForWithdraw && !isWalletSafe) {
			onApprove?.();
			return;
		}

		const isSuccess = await onWithdraw(receipt => console.info('receipt: ', receipt));

		if (isSuccess) {
			plausible(PLAUSIBLE_EVENTS.WITHDRAW, {
				props: {
					vaultAddress: configuration.vault?.address,
					vaultSymbol: configuration.vault?.symbol,
					amountToWithdraw: configuration.tokenToSpend.amount?.display,
					tokenAddress: configuration.tokenToReceive.token?.address,
					tokenSymbol: configuration.tokenToReceive.token?.symbol,
					isZap: isZapNeededForWithdraw
				}
			});
			props.onClose();
			props.openSuccessModal({
				isOpen: true,
				description: (
					<span>
						<span className={'text-regularText/50 whitespace-nowrap'}>{'Successfully withdrawn'}</span>
						&nbsp;
						<span>
							<span>
								{!isZapNeededForWithdraw
									? configuration?.tokenToSpend.amount?.display.slice(0, 7)
									: formatBigIntForDisplay(
											BigInt(quote?.minOutputAmount ?? ''),
											quote?.outputTokenDecimals ?? 18,
											{maximumFractionDigits: 6}
										)}
								<span className={'ml-1'}>{configuration?.tokenToReceive?.token?.symbol}</span>
							</span>
							<span className={'text-regularText/50'}>
								<span className={'mx-1'}>{'to your wallet'}</span>
							</span>
						</span>
					</span>
				)
			});
		}
	}, [
		address,
		configuration.tokenToReceive.token?.address,
		configuration.tokenToReceive.token?.symbol,
		configuration.tokenToSpend.amount?.display,
		configuration.vault?.address,
		configuration.vault?.symbol,
		isApproved,
		isWalletSafe,
		isZapNeededForWithdraw,
		onApprove,
		onConnect,
		onWithdraw,
		plausible,
		props,
		quote?.minOutputAmount,
		quote?.outputTokenDecimals
	]);

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
		if (isWalletSafe) {
			return 'Approve and Withdraw';
		}
		if (!isApproved && isZapNeededForWithdraw) {
			return 'Approve';
		}
		return 'Withdraw';
	}, [address, canZap, isFetchingQuote, isWalletSafe, isApproved, isZapNeededForWithdraw]);

	const isWithdrawDisabled =
		!props.isReady ||
		!configuration?.tokenToSpend.amount ||
		configuration?.tokenToSpend.amount.raw === 0n ||
		(configuration?.tokenToSpend.amount && configuration?.tokenToSpend.amount?.raw > props.availableBalance.raw);

	return (
		<Button
			onClick={onAction}
			isBusy={isFetchingQuote || isWithdrawing || isApproving}
			isDisabled={isWithdrawDisabled}
			spinnerClassName={'text-background size-4 animate-spin'}
			className={cl(
				'text-black flex w-full justify-center regularTextspace-nowrap rounded-lg bg-regularText md:px-[34.5px] py-5 font-bold',
				'disabled:bg-regularText/10 disabled:text-regularText/30 disabled:cursor-not-allowed !h-12'
			)}>
			{buttonTitle}
		</Button>
	);
}

function WithdrawModalContent(props: TWithdrawModalProps): ReactElement {
	const {configuration, dispatchConfiguration} = useManageVaults();
	const {vaultBalanceOf} = useSolver();
	const [isReady, set_isReady] = useState(false);

	/**********************************************************************************************
	 ** We are using a little timeout so the app feels more responsive. We set isReady to true
	 ** after 500ms. Before that, we just display a bunch of skeletons.
	 *********************************************************************************************/
	useTimeout(() => set_isReady(true), 500);

	/**********************************************************************************************
	 ** The useWithdraw hook returns the balanceOf the user in term of assets (underlying). This
	 ** value is exprimed in bigint and should be normalized for our usage.
	 ** This is prefered from the `getBalance` hook as it's more precise.
	 **
	 ** @params void
	 ** @returns availableBalance: TNormalizedBN - The balance of the user in the vault.
	 *********************************************************************************************/
	const availableBalance = useMemo(() => {
		return toNormalizedBN(vaultBalanceOf, configuration?.tokenToSpend?.token?.decimals ?? 18);
	}, [vaultBalanceOf, configuration?.tokenToSpend?.token?.decimals]);

	/**********************************************************************************************
	 ** This useEffect is used to set the withdraw configuration. It's called every time the vault
	 ** changes, or once we are getting the balance of the vault.
	 *********************************************************************************************/
	useEffect(() => {
		if (configuration.action !== 'WITHDRAW') {
			dispatchConfiguration({
				type: 'SET_WITHDRAW',
				payload: {
					vault: props.vault,
					toReceive: {
						token: {
							address: props.vault.token.address,
							symbol: props.vault.token.symbol,
							name: props.vault.token.name,
							decimals: props.vault.token.decimals,
							chainID: props.vault.chainID,
							value: 0
						},
						amount: availableBalance
					},
					toSpend: {
						token: {
							address: props.vault.address,
							name: props.vault.name,
							symbol: props.vault.symbol,
							decimals: props.vault.decimals,
							chainID: props.vault.chainID,
							value: 0
						},
						amount: availableBalance
					}
				}
			});
		} else {
			dispatchConfiguration({
				type: 'SET_AMOUNT_TO_SPEND',
				payload: availableBalance
			});
		}
	}, [configuration.action, dispatchConfiguration, props.vault, availableBalance]);

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
					<IconCross className={'size-4'} />
				</button>

				<div className={'mb-4 flex w-full justify-start text-xl'}>
					<p className={'text-lg font-bold'}>{'Withdraw'}</p>
				</div>

				<Fragment>
					<VaultLink
						vault={props.vault}
						yearnfiLink={props.yearnfiLink}
					/>
					<InputAmountComponent
						isReady={isReady}
						availableBalance={availableBalance}
					/>
				</Fragment>

				<Fragment>
					<div className={'mb-4 mt-10 flex w-full justify-start'}>
						<p className={'text-lg font-bold'}>{'Receive'}</p>
					</div>

					<OutputComponent
						isReady={isReady}
						availableBalance={availableBalance}
					/>
				</Fragment>

				<ButtonComponent
					isReady={isReady}
					availableBalance={availableBalance}
					onClose={props.onClose}
					openSuccessModal={props.openSuccessModal}
				/>
			</motion.div>
		</ModalWrapper>
	);
}

export function WithdrawModal(props: TWithdrawModalProps): ReactElement {
	if (!props.isOpen) {
		return <Fragment />;
	}
	return <WithdrawModalContent {...props} />;
}
