import {type ReactElement, useCallback, useMemo, useState} from 'react';
import Link from 'next/link';
import {serialize} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {
	cl,
	formatAmount,
	formatLocalAmount,
	formatPercent,
	isZeroAddress,
	toAddress,
	toNormalizedBN,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {getNetwork} from '@builtbymom/web3/utils/wagmi';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {usePrices} from '@lib/contexts/usePrices';
import {toPercent} from '@lib/utils/tools';
import {createUniqueID} from '@lib/utils/tools.identifiers';

import {IconExternalLink} from '../icons/IconExternalLink';
import {DepositModal} from './DepositModal';
import {ImageWithFallback} from './ImageWithFallback';
import {SuccessModal} from './SuccessModal';
import {WithdrawModal} from './WithdrawModal';

import type {TNormalizedBN} from '@builtbymom/web3/types';
import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';

type TVaultItem = {
	vault: TYDaemonVault;
	price: TNormalizedBN;
};
export type TSuccessModal = {
	isOpen: boolean;
	description: ReactElement | null;
};

export const VaultItem = ({vault, price}: TVaultItem): ReactElement => {
	const {balances, getBalance, getToken, isLoadingOnChain, onRefresh} = useWallet();
	const {configuration} = useManageVaults();
	const [successModal, set_successModal] = useState<TSuccessModal>({isOpen: false, description: null});
	const isDepositModalOpen = configuration.action === 'DEPOSIT' && configuration.vault?.address === vault.address;
	const isWithdrawModalOpen = configuration.action === 'WITHDRAW' && configuration.vault?.address === vault.address;

	/**********************************************************************************************
	 ** Balances is an object with multiple level of depth. We want to create a unique hash from
	 ** it to know when it changes. This new hash will be used to trigger the useEffect hook.
	 ** We will use classic hash function to create a hash from the balances object.
	 *********************************************************************************************/
	const currentBalanceIdentifier = useMemo(() => {
		const hash = createUniqueID(serialize(balances));
		return hash;
	}, [balances]);

	const {getPrice} = usePrices();

	/**********************************************************************************************
	 ** In some situations, the token is not in the list and we need to fetch/get it. This
	 ** hooks will trigger the onRefresh function to fetch the token once we are sure that we are
	 ** missing it.
	 *********************************************************************************************/
	useAsyncTrigger(async () => {
		if (!isLoadingOnChain(vault.chainID)) {
			const token = getToken({address: vault.address, chainID: vault.chainID});
			if (isZeroAddress(token.address)) {
				onRefresh([{chainID: vault.chainID, address: vault.address}]);
			}
		}
	}, [getToken, isLoadingOnChain, onRefresh, vault.address, vault.chainID]);

	/**********************************************************************************************
	 ** Retrieve the user's balance for the current vault. We will use the getBalance function
	 ** from the useWallet hook to retrieve the balance. We are using currentBalanceIdentifier as a
	 ** dependency to trigger the useEffect hook when the balances object changes.
	 *********************************************************************************************/
	const balance = useMemo(() => {
		currentBalanceIdentifier;
		const value = getBalance({address: vault.address, chainID: vault.chainID}).normalized || 0;
		return value;
	}, [getBalance, vault.address, vault.chainID, currentBalanceIdentifier]);

	/**********************************************************************************************
	 ** The totalDeposits is the total value locked in the vault. We will use the tvl property
	 ** from the vault object and format it using the formatAmount function.
	 *********************************************************************************************/
	const totalDeposits = useMemo(() => {
		if (vault.tvl.tvl === 0) {
			return '$0.00';
		}
		if (vault.tvl.tvl < 0.01) {
			return '$0.00';
		}
		return `$${formatLocalAmount(vault.tvl.tvl, 4, '$', {
			displayDigits: 2,
			maximumFractionDigits: 2,
			minimumFractionDigits: 2,
			shouldCompactValue: true
		})}`;
	}, [vault.tvl.tvl]);

	/**********************************************************************************************
	 ** totalProfit is the value the user could potentially get after 1 year of stacking money.
	 ** We are basically multiply amount the users typed with apr and price of the token.
	 *********************************************************************************************/
	const totalProfit = useMemo(() => {
		const price =
			getPrice({
				chainID: Number(configuration?.tokenToSpend.token?.chainID),
				address: toAddress(configuration?.tokenToSpend.token?.address)
			})?.normalized ?? 0;
		return `$${formatLocalAmount(
			Number(configuration?.tokenToSpend.amount?.normalized) * vault.apr.netAPR * price +
				Number(configuration?.tokenToSpend.amount?.normalized) * price,
			4,
			'$',
			{
				displayDigits: 2,
				maximumFractionDigits: 2,
				minimumFractionDigits: 2,
				shouldCompactValue: true
			}
		)}`;
	}, [
		configuration?.tokenToSpend.amount?.normalized,
		configuration?.tokenToSpend.token?.address,
		configuration?.tokenToSpend.token?.chainID,
		getPrice,
		vault.apr.netAPR
	]);

	const {dispatchConfiguration} = useManageVaults();

	/**********************************************************************************************
	 ** onDepositClick is a callback that sets "DEPOSIT" (and it opens deposit modal) to reducer
	 ** as action and sets vault token as default to be deposited.
	 *********************************************************************************************/
	const onDepositClick = useCallback(async (): Promise<void> => {
		dispatchConfiguration({
			type: 'SET_DEPOSIT',
			payload: {
				vault,
				toSpend: {
					token: {
						address: vault.token.address,
						name: vault.token.name,
						symbol: vault.token.symbol,
						decimals: vault.token.decimals,
						chainID: vault.chainID,
						value: 0,
						balance: getBalance({address: vault.token.address, chainID: vault.chainID})
					},
					amount: getBalance({address: vault.token.address, chainID: vault.chainID})
				}
			}
		});
	}, [dispatchConfiguration, getBalance, vault]);

	/**********************************************************************************************
	 ** onWithdrawClick is a callback that sets "WITHDRAW" (and it opens withdraw modal) to reducer
	 ** as action and sets vault token as default to be withdrawn.
	 *********************************************************************************************/
	const onWithdrawClick = useCallback(async (): Promise<void> => {
		dispatchConfiguration({
			type: 'SET_WITHDRAW',
			payload: {
				vault,
				toReceive: {
					token: {
						address: vault.token.address,
						symbol: vault.token.symbol,
						name: vault.token.name,
						decimals: vault.token.decimals,
						chainID: vault.chainID,
						balance: zeroNormalizedBN,
						value: 0
					},
					amount: getBalance({address: vault.address, chainID: vault.chainID})
				},
				toSpend: {
					token: {
						address: vault.token.address,
						name: vault.token.name,
						symbol: vault.token.symbol,
						decimals: vault.token.decimals,
						chainID: vault.chainID,
						value: 0,
						balance: getBalance({address: vault.token.address, chainID: vault.chainID})
					},
					amount: getBalance({address: vault.token.address, chainID: vault.chainID})
				}
			}
		});
	}, [dispatchConfiguration, getBalance, vault]);

	/**********************************************************************************************
	 ** Create the link to the Yearn.fi website. The link will be different depending on the
	 ** vault version.
	 *********************************************************************************************/
	const yearnfiLink = useMemo(() => {
		const vaultOrV3 = vault.version.startsWith('3') ? 'v3' : 'vaults';
		return `https://yearn.fi/${vaultOrV3}/${vault.chainID}/${vault.address}`;
	}, [vault.address, vault.chainID, vault.version]);

	return (
		<div>
			<DepositModal
				isOpen={isDepositModalOpen}
				onClose={() => dispatchConfiguration({type: 'RESET'})}
				vault={vault}
				yearnfiLink={yearnfiLink}
				hasBalanceForVault={balance > 0}
				openSuccessModal={set_successModal}
				totalProfit={totalProfit}
			/>
			<WithdrawModal
				isOpen={isWithdrawModalOpen}
				onClose={() => dispatchConfiguration({type: 'RESET'})}
				vault={vault}
				yearnfiLink={yearnfiLink}
				hasBalanceForVault={balance > 0}
				openSuccessModal={set_successModal}
			/>
			<SuccessModal
				onClose={() => set_successModal({isOpen: false, description: null})}
				isOpen={successModal.isOpen}
				description={successModal.description}
			/>
			{/* Desctop screen Item */}
			<div className={'bg-regularText/3 hidden h-24 min-h-[68px] rounded-xl p-2.5 md:grid md:grid-cols-7'}>
				<Link
					href={yearnfiLink}
					target={'_blank'}
					className={
						'border-regularText/15 bg-regularText/5 col-span-2 flex cursor-alias items-center justify-start overflow-hidden rounded-xl border p-3'
					}>
					<ImageWithFallback
						src={`https://assets.smold.app/tokens/${vault.chainID}/${vault.token.address}/logo-32.png`}
						alt={vault.token.symbol}
						width={28}
						height={28}
					/>
					<div className={'ml-2 flex w-full flex-col justify-start overflow-hidden'}>
						<div className={'flex items-center justify-between gap-x-2'}>
							<p className={'w-full truncate'}>{vault.name}</p>
							<IconExternalLink className={'ml-auto size-3 min-w-3'} />
						</div>

						<p className={'text-regularText/50 w-full'}>{getNetwork(vault.chainID).name}</p>
					</div>
				</Link>
				<div className={'font-number flex items-center justify-end'}>
					<div className={'text-right font-mono font-semibold'}>
						{toPercent(vault.apr.netAPR)}
						<div className={'text-regularText invisible text-right text-xs'}>&nbsp;</div>
					</div>
				</div>

				<div className={'font-number flex items-center justify-end'}>
					<div className={'text-right font-mono'}>
						{totalDeposits}
						<div className={'text-regularText invisible text-right text-xs'}>&nbsp;</div>
					</div>
				</div>

				<div className={'font-number flex items-center justify-end'}>
					<div className={'w-2/3 overflow-hidden text-right font-mono'}>
						{`$${formatAmount(balance * price.normalized, 2, 2)}`}
						<div
							title={`${formatAmount(balance * toNormalizedBN(vault.pricePerShare, vault.decimals).normalized)} ${
								vault.token.symbol
							}`}
							className={'text-regularText truncate text-right text-xs text-opacity-40'}>
							{`${formatAmount(balance * toNormalizedBN(vault.pricePerShare, vault.decimals).normalized)} ${vault.token.symbol}`}
						</div>
					</div>
				</div>
				<div className={cl('col-span-2 flex items-center justify-end gap-x-2 pl-10')}>
					{balance ? (
						<button
							onClick={onWithdrawClick}
							className={
								'border-regularText/5 bg-regularText/5 text-regularText hover:bg-regularText/15 !h-12 w-full rounded-xl border p-3 transition-colors '
							}>
							{'Withdraw'}
						</button>
					) : null}
					<button
						onClick={onDepositClick}
						className={
							'bg-button hover:bg-buttonHover text-accentText !h-12 w-full rounded-xl p-3 transition-colors'
						}>
						{'Deposit'}
					</button>
				</div>
			</div>

			{/* Mobile screen Item */}
			<div className={'bg-table flex w-full flex-col gap-y-6 rounded-2xl p-6 md:hidden'}>
				<Link
					href={yearnfiLink}
					target={'_blank'}
					className={
						'border-regularText/15 bg-regularText/5 flex w-full items-center rounded-xl border px-2.5 py-2'
					}>
					<ImageWithFallback
						src={`https://assets.smold.app/tokens/${vault.chainID}/${vault.token.address}/logo-32.png`}
						alt={vault.token.symbol}
						width={28}
						height={28}
					/>
					<div className={'ml-2 flex flex-col justify-start'}>
						<div className={'flex items-center gap-x-2'}>
							<p className={'w-full'}>{vault.name}</p>
							<IconExternalLink className={'size-4'} />
						</div>

						<p className={'text-regularText/50 w-full'}>{getNetwork(vault.chainID).name}</p>
					</div>
				</Link>

				<div className={'flex w-full justify-between'}>
					<div className={'flex items-center gap-x-2 text-sm'}>
						<p>{'APR'}</p>
					</div>
					<div>{formatPercent(vault.apr.netAPR)}</div>
				</div>

				<div className={'flex w-full justify-between'}>
					<div className={'flex items-center'}>
						<p>{'Total Deposits'}</p>
					</div>
					<div>{totalDeposits}</div>
				</div>

				<div className={'flex w-full justify-between'}>
					<div className={'flex items-center'}>
						<p>{'My balance'}</p>
					</div>
					<div>{balance}</div>
				</div>

				<div className={'flex gap-x-6'}>
					{balance ? (
						<button
							onClick={onWithdrawClick}
							className={
								'border-regularText/5 bg-regularText/5 text-regularText hover:bg-regularText/15 !h-12 w-full rounded-xl border p-3 transition-colors '
							}>
							{'Withdraw'}
						</button>
					) : null}
					<button
						onClick={onDepositClick}
						className={
							'bg-button hover:bg-buttonHover text-accentText !h-12 w-full rounded-xl p-3 transition-colors'
						}>
						{'Deposit'}
					</button>
				</div>
			</div>
		</div>
	);
};
