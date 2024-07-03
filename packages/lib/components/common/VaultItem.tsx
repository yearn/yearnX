import {type ReactElement, useMemo} from 'react';
import Link from 'next/link';
import {formatAmount, formatPercent, toNormalizedBN} from '@builtbymom/web3/utils';

import {IconCircleQuestion} from '../icons/IconCircleQuestion';

import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';

type TVaultItem = {
	vault: TYDaemonVault;
};
export const VaultItem = ({vault}: TVaultItem): ReactElement => {
	const getPercent = (value: number): string => {
		return `${(value * 100).toFixed(2)}%`;
	};

	const balance = useMemo(() => {
		const value = toNormalizedBN(vault.tvl.totalAssets, vault.token.decimals).normalized;
		return formatAmount(value);
	}, [vault.token.decimals, vault.tvl.totalAssets]);

	const totalDeposits = useMemo(() => {
		return formatAmount(vault.tvl.tvl);
	}, [vault.tvl.tvl]);

	return (
		<div>
			{/* Desctop screen Item */}
			<div className={'bg-background hidden min-h-[68px] rounded-xl p-2.5 md:grid md:grid-cols-5'}>
				<Link
					href={'/'}
					className={'border-border flex items-center rounded-xl border bg-purple-200 p-3'}>
					{vault.name}
				</Link>
				<div className={'flex items-center justify-center  font-mono font-semibold'}>
					{getPercent(vault.apr.extra.stakingRewardsAPR)}
				</div>
				<div className={'flex items-center justify-center'}>{totalDeposits}</div>
				<div className={'flex items-center justify-center'}>{balance}</div>
				<div className={'flex items-center justify-center gap-x-2'}>
					<button className={'bg-button !h-12 w-32 rounded-xl p-3'}>{'Deposit'}</button>
				</div>
			</div>

			{/* Mobile screen Item */}
			<div className={'bg-table flex w-full flex-col gap-y-6 rounded-2xl p-6 md:hidden'}>
				<Link
					href={'/'}
					className={'border-border w-full rounded-xl border bg-purple-200 px-2.5 py-2'}>
					{vault.name}
				</Link>
				<div className={'flex w-full justify-between'}>
					<div className={'flex items-center gap-x-2 text-sm'}>
						<p>{'APR'}</p>
						<IconCircleQuestion className={'size-4 text-white'} />
					</div>
					<div>{formatPercent(vault.apr.extra.stakingRewardsAPR)}</div>
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
					<button className={'w-full rounded-xl border border-white p-3'}>{'Withdraw'}</button>
					<button className={'bg-button w-full rounded-xl p-3'}>{'Deposit'}</button>
				</div>
			</div>
		</div>
	);
};
