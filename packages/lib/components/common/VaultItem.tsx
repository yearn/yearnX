import {type ReactElement, useCallback, useMemo, useState} from 'react';
import Link from 'next/link';
import {serialize} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {cl, formatAmount, formatLocalAmount, formatPercent, toNormalizedBN} from '@builtbymom/web3/utils';
import {getNetwork} from '@builtbymom/web3/utils/wagmi';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {createUniqueID} from '@lib/utils/tools.identifiers';

import {IconCircleQuestion} from '../icons/IconCircleQuestion';
import {IconExternalLink} from '../icons/IconExternalLink';
import {DepositModal} from './DepositModal';
import {ImageWithFallback} from './ImageWithFallback';
import {WithdrawModal} from './WithdrawModal';

import type {TNormalizedBN} from '@builtbymom/web3/types';
import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';

type TVaultItem = {
	vault: TYDaemonVault;
	price: TNormalizedBN;
};

function toPercent(value: number): string {
	return `${(value * 100).toFixed(2)}%`;
}

export const VaultItem = ({vault, price}: TVaultItem): ReactElement => {
	const {balances, getBalance} = useWallet();
	const [isDepositModalOpen, set_isDepositModalOpen] = useState(false);
	const [isWithdrawModalOpen, set_isWithdrawModalOpen] = useState(false);

	const {dispatchConfiguration} = useManageVaults();

	const onDepositClick = useCallback((): void => {
		set_isDepositModalOpen(true);
		dispatchConfiguration({type: 'SET_VAULT', payload: vault});
		dispatchConfiguration({
			type: 'SET_ASSET_TO_DEPOSIT',
			payload: {
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
		});
	}, [dispatchConfiguration, getBalance, vault]);

	const onWithdrawClick = useCallback((): void => {
		set_isWithdrawModalOpen(true);
		dispatchConfiguration({type: 'SET_VAULT', payload: vault});
		dispatchConfiguration({
			type: 'SET_ASSET_TO_WITHDRAW',
			payload: {
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
		});
	}, [dispatchConfiguration, getBalance, vault]);

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
		const value = getBalance({address: vault.address, chainID: vault.chainID}).normalized || 0;
		return value;
	}, [getBalance, vault.address, vault.chainID, currentBalanceIdentifier]);

	/**********************************************************************************************
	 ** The totalDeposits is the total value locked in the vault. We will use the tvl property
	 ** from the vault object and format it using the formatAmount function.
	 *********************************************************************************************/
	const totalDeposits = useMemo(() => {
		return formatLocalAmount(vault.tvl.tvl, 4, '$', {
			displayDigits: 2,
			maximumFractionDigits: 2,
			minimumFractionDigits: 2,
			shouldCompactValue: true
		});
	}, [vault.tvl.tvl]);

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
				onClose={() => set_isDepositModalOpen(false)}
				vault={vault}
				yearnfiLink={yearnfiLink}
				hasBalanceForVault={balance > 0}
			/>
			<WithdrawModal
				isOpen={isWithdrawModalOpen}
				onClose={() => set_isWithdrawModalOpen(false)}
				vault={vault}
				yearnfiLink={yearnfiLink}
				hasBalanceForVault={balance > 0}
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
					<div className={'ml-2 flex flex-col justify-start'}>
						<div className={'flex max-w-56 items-center gap-x-2 overflow-hidden '}>
							<p className={'w-full truncate'}>{vault.name}</p>
							<IconExternalLink className={'size-4'} />
						</div>

						<p className={'text-regularText/50 w-full'}>{getNetwork(vault.chainID).name}</p>
					</div>
				</Link>
				<div className={'flex items-center justify-center  font-mono font-semibold'}>
					{toPercent(vault.apr.extra.stakingRewardsAPR)}
				</div>
				<div className={'font-number flex items-center justify-end'}>{`$${totalDeposits}`}</div>
				<div className={'font-number flex items-center justify-end text-right'}>
					<div className={'text-right'}>
						{`$${formatAmount(balance * price.normalized, 2, 2)}`}
						<div className={'text-regularText text-right text-xs text-opacity-40'}>
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
						<IconCircleQuestion className={'text-regularText size-4'} />
					</div>
					<div>{formatPercent(vault.apr.netAPR)}</div>
				</div>

				<div className={'flex w-full justify-between'}>
					<div className={'flex items-center'}>
						<p>{'Total Deposits'}</p>
					</div>
					<div>{`$${totalDeposits}`}</div>
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
