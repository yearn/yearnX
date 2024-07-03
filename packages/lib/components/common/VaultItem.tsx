import {type ReactElement, useMemo} from 'react';
import Link from 'next/link';
import {serialize} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {formatAmount, formatLocalAmount, formatPercent, toNormalizedBN} from '@builtbymom/web3/utils';
import {getChain} from '@lib/utils/tools';
import {createUniqueID} from '@lib/utils/tools.identifiers';

import {IconCircleQuestion} from '../icons/IconCircleQuestion';
import {ImageWithFallback} from './ImageWithFallback';

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
			{/* Desctop screen Item */}
			<div className={'bg-background hidden min-h-[68px] rounded-xl p-2.5 md:grid md:grid-cols-6'}>
				<Link
					href={yearnfiLink}
					className={
						'border-border col-span-2 flex cursor-alias  items-center justify-start rounded-xl border bg-purple-200 p-3'
					}>
					<ImageWithFallback
						src={`https://assets.smold.app/tokens/${vault.chainID}/${vault.token.address}/logo-32.png`}
						alt={vault.token.symbol}
						width={28}
						height={28}
					/>
					<div className={'ml-2 flex flex-col'}>
						<p className={'w-full'}>{vault.name}</p>
						<p className={'text-purple-0 w-full'}>{getChain(vault.chainID)}</p>
					</div>
				</Link>
				<div className={'flex items-center justify-center  font-mono font-semibold'}>
					{toPercent(vault.apr.extra.stakingRewardsAPR)}
				</div>
				<div className={'font-number flex items-center justify-end'}>{`$${totalDeposits}`}</div>
				<div className={'font-number flex items-center justify-end text-right'}>
					<div className={'text-right'}>
						{`$${formatAmount(balance * price.normalized, 2, 2)}`}
						<div className={'text-neutral-0 text-right text-xs text-opacity-40'}>
							{`${formatAmount(balance * toNormalizedBN(vault.pricePerShare, vault.decimals).normalized)} ${vault.token.symbol}`}
						</div>
					</div>
				</div>
				<div className={'flex items-center justify-center gap-x-2'}>
					<button className={'bg-button !h-12 w-32 rounded-xl p-3'}>{'Deposit'}</button>
				</div>
			</div>

			{/* Mobile screen Item */}
			<div className={'bg-table flex w-full flex-col gap-y-6 rounded-2xl p-6 md:hidden'}>
				<Link
					href={'/'}
					className={'border-border flex w-full items-center rounded-xl border bg-purple-200 px-2.5 py-2'}>
					<ImageWithFallback
						src={`https://assets.smold.app/tokens/${vault.chainID}/${vault.token.address}/logo-32.png`}
						alt={vault.token.symbol}
						width={28}
						height={28}
					/>
					<div className={'ml-2 flex flex-col'}>
						<p className={'w-full'}>{vault.name}</p>
						<p className={'text-purple-0 w-full'}>{getChain(vault.chainID)}</p>
					</div>
				</Link>

				<div className={'flex w-full justify-between'}>
					<div className={'flex items-center gap-x-2 text-sm'}>
						<p>{'APR'}</p>
						<IconCircleQuestion className={'size-4 text-white'} />
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
					<button className={'w-full rounded-xl border border-white p-3'}>{'Withdraw'}</button>
					<button className={'bg-button w-full rounded-xl p-3'}>{'Deposit'}</button>
				</div>
			</div>
		</div>
	);
};
