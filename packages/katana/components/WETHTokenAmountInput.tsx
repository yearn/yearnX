import {type ReactElement, useMemo, useRef,useState} from 'react';
import InputNumber from 'rc-input-number';
import {useOnClickOutside} from 'usehooks-ts';
import {useBalance} from 'wagmi';
import {Button} from '@lib/components/common/Button';
import {ImageWithFallback} from '@lib/components/common/ImageWithFallback';
import {IconChevron} from '@lib/components/icons/IconChevron';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import useWallet from '@lib/contexts/useWallet';
import {useWeb3} from '@lib/contexts/useWeb3';
import {useAsyncTrigger} from '@lib/hooks/useAsyncTrigger';
import {cl, formatAmount, fromNormalized, toNormalizedBN, zeroNormalizedBN} from '@lib/utils';
import {acknowledge, toPercent} from '@lib/utils/tools';

import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';
import type {TNormalizedBN, TToken} from '@lib/types';

const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const WETH_ADDRESS = '0xEE7D8BCFb72bC1880D0Cf19822eB0A2e6577aB62' as const;

type TWETHTokenAmountInputProps = {
	vault: TYDaemonVault;
	buttonTitle: string;
	isPerformingAction: boolean;
	onActionClick: () => void;
	isDisabled: boolean;
	set_tokenToUse: (token: TToken, amount: TNormalizedBN) => void;
	totalProfit?: string;
	apy: number;
};

export function WETHTokenAmountInput(props: TWETHTokenAmountInputProps): ReactElement {
	const {vault} = props;
	const {address} = useWeb3();
	const {configuration, dispatchConfiguration} = useManageVaults();
	const {balanceHash, getBalance, onRefresh} = useWallet();
	const [isTokenSelectorOpen, set_isTokenSelectorOpen] = useState(false);
	const selectorRef = useRef<HTMLDivElement>(null);
	const selectorButtonRef = useRef<HTMLButtonElement>(null);

	// Get ETH balance
	const {data: ethBalance} = useBalance({
		address: address,
		chainId: vault.chainID
	});

	// Get WETH balance using wagmi hook for consistency
	const {data: wethBalanceData} = useBalance({
		address: address,
		token: WETH_ADDRESS as `0x${string}`,
		chainId: vault.chainID
	});

	// Get WETH balance
	const wethBalance = useMemo(() => {
		acknowledge(balanceHash);
		// Try to get from wallet first, then fall back to wagmi data
		const walletBalance = getBalance({address: WETH_ADDRESS, chainID: vault.chainID});
		if (walletBalance.raw > 0n) {
			return walletBalance;
		}
		// Use wagmi balance data if available
		if (wethBalanceData) {
			return toNormalizedBN(wethBalanceData.value, wethBalanceData.decimals);
		}
		return zeroNormalizedBN;
	}, [balanceHash, getBalance, vault.chainID, wethBalanceData]);

	// Create token objects for ETH and WETH
	const tokens = useMemo((): TToken[] => {
		const ethToken: TToken = {
			address: ETH_ADDRESS,
			symbol: 'ETH',
			name: 'Ethereum',
			decimals: 18,
			chainID: vault.chainID,
			balance: toNormalizedBN(ethBalance?.value || 0n, 18),
			value: 0
		};

		const wethToken: TToken = {
			address: WETH_ADDRESS,
			symbol: 'vbETH',
			name: 'Wrapped Ether',
			decimals: 18,
			chainID: vault.chainID,
			balance: wethBalance,
			value: 0
		};

		// Always show both tokens in the same order
		return [wethToken, ethToken];
	}, [ethBalance, wethBalance, vault.chainID]);

	// Set default token only once on mount - always default to WETH
	useMemo(() => {
		// Only set default if no token is selected yet
		if (!configuration?.tokenToSpend?.token && tokens.length > 0) {
			// Always default to WETH (first token in array)
			const wethToken = tokens.find(t => t.address === WETH_ADDRESS);
			if (wethToken) {
				props.set_tokenToUse(wethToken, zeroNormalizedBN);
			}
		}
	}, [configuration?.tokenToSpend?.token, tokens, props]);

	// Refresh WETH balance on mount and when address changes
	useAsyncTrigger(async () => {
		if (address && vault.chainID) {
			// Only refresh if we don't have the balance yet
			const currentBalance = getBalance({address: WETH_ADDRESS, chainID: vault.chainID});
			if (currentBalance.raw === 0n && !wethBalanceData) {
				await onRefresh([{chainID: vault.chainID, address: WETH_ADDRESS}]);
			}
		}
	}, [address, vault.chainID, onRefresh, getBalance, wethBalanceData]);

	useOnClickOutside<HTMLDivElement | HTMLButtonElement>([selectorRef, selectorButtonRef], () =>
		set_isTokenSelectorOpen(false)
	);

	const onSelectToken = (token: TToken): void => {
		props.set_tokenToUse(token, configuration?.tokenToSpend?.amount || zeroNormalizedBN);
		set_isTokenSelectorOpen(false);
	};

	const onChangeValue = (value: TNormalizedBN | undefined): void => {
		if (!value || !configuration.tokenToSpend.token) {
			return dispatchConfiguration({
				type: 'SET_TOKEN_TO_SPEND',
				payload: {token: configuration.tokenToSpend.token, amount: zeroNormalizedBN}
			});
		}
		dispatchConfiguration({
			type: 'SET_TOKEN_TO_SPEND',
			payload: {token: configuration.tokenToSpend.token, amount: value}
		});
	};

	const onMaxClick = (): void => {
		const token = configuration?.tokenToSpend?.token;
		if (!token) {
return;
}

		const balance = token.address === ETH_ADDRESS ?
			toNormalizedBN(ethBalance?.value || 0n, 18) :
			wethBalance;

		dispatchConfiguration({
			type: 'SET_TOKEN_TO_SPEND',
			payload: {token, amount: balance}
		});
	};

	const selectedToken = configuration?.tokenToSpend?.token;
	const isETHSelected = selectedToken?.address === ETH_ADDRESS;

	const selectedBalance = selectedToken?.address === ETH_ADDRESS ?
		toNormalizedBN(ethBalance?.value || 0n, 18) :
		wethBalance;

	return (
		<div className={'flex w-full flex-col items-start gap-y-2'}>
			<div className={'flex w-full flex-col gap-y-1'}>
				<div className={'flex w-full gap-x-2'}>
					<div className={'relative h-full'}>
						<button
							ref={selectorButtonRef}
							onClick={() => set_isTokenSelectorOpen(!isTokenSelectorOpen)}
							className={
								'border-regularText/15 bg-regularText/5 relative flex !h-16 items-center gap-x-1 rounded-lg border px-4 py-3'
							}>
							<ImageWithFallback
								src={`https://assets.smold.app/tokens/${vault.chainID}/${selectedToken?.address === ETH_ADDRESS ? WETH_ADDRESS : selectedToken?.address}/logo-128.png`}
								alt={selectedToken?.symbol || 'token'}
								width={32}
								height={32}
							/>
							<p className={'text-regularText/50'}>{selectedToken?.symbol}</p>
							<IconChevron className={'text-regularText size-5'} />
						</button>

						{isTokenSelectorOpen && (
							<div
								ref={selectorRef}
								className={'bg-background border-regularText/15 absolute left-0 top-full z-50 mt-2 w-48 rounded-lg border shadow-lg'}>
								<div className={'p-2'}>
									{tokens.map((token) => (
										<button
											key={token.address}
											onClick={() => onSelectToken(token)}
											className={'hover:bg-regularText/5 flex w-full items-center gap-x-2 rounded-lg p-2'}>
											<ImageWithFallback
												src={`https://assets.smold.app/tokens/${vault.chainID}/${token.address === ETH_ADDRESS ? WETH_ADDRESS : token.address}/logo-128.png`}
												alt={token.symbol}
												width={24}
												height={24}
											/>
											<div className={'flex flex-col items-start'}>
												<p className={'text-sm font-medium'}>{token.symbol}</p>
												<p className={'text-regularText/50 text-xs'}>
													{formatAmount(token.balance.normalized, 6)}
												</p>
											</div>
										</button>
									))}
								</div>
							</div>
						)}
					</div>

					<label
						className={cl(
							'z-20 !h-16 w-full relative transition-all border border-regularText/15',
							'flex flex-row items-center cursor-text',
							'focus:placeholder:text-regularText/40 placeholder:transition-colors',
							'py-2 pl-0 pr-4 group border-regularText/15 bg-regularText/5 rounded-lg'
						)}>
						<div className={'relative w-full pr-2'}>
							<InputNumber
								prefixCls={cl(
									'w-full h-full focus:border-none rounded-lg border-none bg-transparent text-xl transition-colors',
									'placeholder:text-regularText/20 focus:placeholder:text-regularText/30',
									'placeholder:transition-colors !h-16 !ring-0 !ring-offset-0'
								)}
								min={0}
								step={0.1}
								decimalSeparator={'.'}
								placeholder={'0.00'}
								controls={false}
								value={
									!configuration?.tokenToSpend.amount?.normalized ||
									configuration?.tokenToSpend.amount?.normalized === 0
										? ''
										: configuration?.tokenToSpend.amount?.normalized
								}
								onChange={value => {
									if (!value || !configuration.tokenToSpend.token) {
										return onChangeValue(undefined);
									}
									const {decimals} = configuration.tokenToSpend.token;
									onChangeValue(toNormalizedBN(fromNormalized(value, decimals), decimals));
								}}
							/>
						</div>
						<button
							onClick={onMaxClick}
							disabled={!address}
							className={
								'border-regularText/15 bg-regularText/5 text-regularText rounded-lg border p-2 disabled:cursor-not-allowed'
							}>
							{'Max'}
						</button>
					</label>
				</div>
			</div>
			<button
				onClick={onMaxClick}
				className={'text-regularText text-right text-xs text-opacity-40'}>
				{`Available: ${formatAmount(selectedBalance.normalized)} ${selectedToken?.symbol}`}
			</button>

			<div className={'my-10 flex w-full justify-between'}>
				<div>
					<span className={'mr-1'}>{'APY:'}</span>
					<span className={'font-bold'}>{toPercent(props.apy)}</span>
				</div>
				{Boolean(configuration?.tokenToSpend.amount?.normalized) && (
					<span className={'text-base'}>
						{'+ '}
						{props.totalProfit}
						{' over 1y'}
					</span>
				)}
			</div>

			{isETHSelected && (
				<div className={'mb-4 w-full rounded-lg border border-yellow-600/20 bg-yellow-900/20 p-3'}>
					<p className={'text-sm text-yellow-200'}>
						{'Your ETH will be wrapped to vbETH before being prompted to deposit'}
					</p>
				</div>
			)}

			<Button
				onClick={props.onActionClick}
				isBusy={props.isPerformingAction}
				isDisabled={props.isDisabled || !address}
				spinnerClassName={'text-black size-6 animate-spin'}
				className={cl(
					'text-black flex w-full justify-center regularTextspace-nowrap rounded-lg bg-regularText md:px-[34.5px] py-5 font-bold',
					'disabled:bg-regularText/10 disabled:text-regularText/30 disabled:cursor-not-allowed !h-12'
				)}>
				{props.buttonTitle}
			</Button>
		</div>
	);
}
