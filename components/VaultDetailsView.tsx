import React, {useMemo, useState} from 'react';
import Link from 'next/link';
import {DepositPopupWrapper} from 'components/DepositModal';
import {useReadContract} from 'wagmi';
import {
	cl,
	formatAmount,
	toAddress,
	toBigInt,
	toNormalizedBN,
	truncateHex,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {getNetwork} from '@builtbymom/web3/utils/wagmi';
import {
	calculateUnionProbability,
	type PrizePool,
	SECONDS_PER_WEEK,
	type Vault
} from '@generationsoftware/hyperstructure-client-js';
import {
	useDrawPeriod,
	usePrizeOdds,
	usePrizePool,
	useVault,
	useVaultPrizeYield,
	useVaultPromotionsApr
} from '@generationsoftware/hyperstructure-react-hooks';
import {PRIZE_VAULT_ABI} from '@utils/prizeVault.abi';
import {Counter} from '@common/Counter';
import {ImageWithFallback} from '@common/ImageWithFallback';

import {WithdrawPopupWrapper} from './WithdrawModal';

import type {ReactElement} from 'react';
import type {TNormalizedBN} from '@builtbymom/web3/types';
import type {TVaultData} from '@utils/types';

function DetailViewItem(props: {
	vault: Vault;
	vaultData: TVaultData;
	prizePool: PrizePool;
	balanceOf: TNormalizedBN;
	onOpenDepositPopup: () => void;
	onOpenWithdrawPopup: () => void;
}): ReactElement {
	const {data: prizeYield} = useVaultPrizeYield(props.vault, props.prizePool);
	const {data: promoAPR} = useVaultPromotionsApr(
		props.vault,
		props.prizePool,
		[
			'0x4200000000000000000000000000000000000042', // OP
			'0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // USDC
			'0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // USDC.e
			'0x4200000000000000000000000000000000000006', // WETH
			'0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI
			'0x395Ae52bB17aef68C2888d941736A71dC6d4e125' // POOL
		],
		{fromBlock: 118_900_000n}
	);
	const {data: drawPeriod} = useDrawPeriod(props.prizePool);
	const {data: odds} = usePrizeOdds(props.prizePool, props.vault, props.vaultData.balanceOf.raw, {
		isCumulative: true
	});

	/**********************************************************************************************
	 ** Calculate the weekly chance of winning the prize pool. We need to calculate the weekly
	 ** chance of winning the prize pool in order to display it to the user. We need to know the
	 ** odds of winning the prize pool and the draw period of the prize pool in order to calculate
	 ** the weekly chance of winning the prize pool.
	 *********************************************************************************************/
	const weeklyChance = useMemo((): string => {
		if (!odds) {
			return '';
		}
		if (toBigInt(props.vaultData.balanceOf.raw) === 0n) {
			return '';
		}
		if (!!odds && !!drawPeriod) {
			const drawsPerWeek = SECONDS_PER_WEEK / drawPeriod;
			const events = Array<number>(drawsPerWeek).fill(odds.percent);
			const value = 1 / calculateUnionProbability(events);
			if (value < 1) {
				return formatAmount(value, 4);
			}
			if (value < 10) {
				return formatAmount(value, 2);
			}
			return formatAmount(value, 0, 0);
		}
		return '';
	}, [odds, props.vaultData.balanceOf.raw, drawPeriod]);

	return (
		<div className={'grid rounded-[40px] bg-[#441F93] px-10 pb-10 pt-4'}>
			<div>
				<div className={'flex w-full items-center justify-center'}>
					<div className={'flex w-fit items-center gap-4 rounded-md p-4 backdrop-blur-md'}>
						<ImageWithFallback
							src={`https://assets.smold.app/tokens/10/${props.vaultData.assetAddress}/logo-128.png`}
							style={{width: 36, height: 36, minWidth: 36, minHeight: 36}}
							alt={props.vaultData.assetSymbol}
							width={36}
							height={36}
						/>
						<b className={'block text-4xl'}>{`Prize ${props.vaultData.assetSymbol}`}</b>
					</div>
				</div>
				<div className={'-mt-2 flex w-full items-center justify-center'}>
					<div
						className={
							'flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-white/20 p-2 backdrop-blur-md'
						}>
						<ImageWithFallback
							src={'https://assets.smold.app/chain/10/logo-32.png'}
							alt={props.vaultData.assetSymbol}
							width={16}
							height={16}
						/>
						<p className={'text-sm'}>{'Optimism Prize Pool'}</p>
					</div>
				</div>
			</div>
			<dl className={'mt-10 grid grid-cols-3 gap-y-2 border-t border-white/40 pt-6'}>
				<dt className={'text-sm opacity-80'}>{'Your balance'}</dt>
				<dd className={'col-span-2 text-right'}>
					<Counter
						value={props.balanceOf.normalized}
						decimals={props.vaultData.decimals}
						idealDecimals={2}
						decimalsToDisplay={[2, 4, 6, 8]}
					/>
					<p className={'inline text-xs opacity-40'}>{` ${props.vaultData.assetSymbol}`}</p>
				</dd>

				<dt className={'text-sm opacity-80'}>{'Your Weekly Chance of Winning'}</dt>
				<dd className={'col-span-2 text-right'}>
					{weeklyChance === '∞' ? '1 in 1' : weeklyChance ? `1 in ${weeklyChance}` : '-'}
				</dd>

				<dt className={'text-sm opacity-80'}>{'Prize Yield'}</dt>
				<dd className={'col-span-2 text-right'}>{`${formatAmount(Number(prizeYield), 2, 2)}%`}</dd>

				<dt className={'whitespace-nowrap text-sm opacity-80'}>{'Bonus Rewards'}</dt>
				<dd className={'col-span-2 text-right'}>{`${formatAmount(Number(promoAPR), 2, 2)}%`}</dd>

				<dt className={'text-sm opacity-80'}>{'Total Supply'}</dt>
				<dd className={'col-span-2 text-right'}>
					<Counter
						value={props.vaultData.totalSupply.normalized}
						decimals={props.vaultData.decimals}
						idealDecimals={2}
						decimalsToDisplay={[2, 4, 6, 8]}
					/>
					<p className={'inline text-xs opacity-40'}>{` ${props.vaultData.assetSymbol}`}</p>
				</dd>

				<dt className={'text-sm opacity-80'}>{'Deposit Token'}</dt>
				<dd className={'col-span-2 text-right'}>
					<span className={'flex items-center justify-end gap-2'}>
						{`${props.vaultData.assetSymbol}`}
						<p className={'text-xs'}>{' | '}</p>
						<Link
							target={'_blank'}
							href={
								getNetwork(10).blockExplorers?.default.url + `/address/${props.vaultData.assetAddress}`
							}>
							<p className={'cursor-alias text-xs opacity-40 hover:underline'}>
								{truncateHex(props.vaultData.assetAddress, 4)}
							</p>
						</Link>
					</span>
				</dd>

				<dt className={'text-sm opacity-80'}>{'Prize Token'}</dt>
				<dd className={'col-span-2 text-right'}>
					<span className={'flex items-center justify-end gap-2'}>
						{`${props.vaultData.symbol}`}
						<p className={'text-xs'}>{' | '}</p>
						<Link
							target={'_blank'}
							href={getNetwork(10).blockExplorers?.default.url + `/address/${props.vaultData.address}`}>
							<p className={'cursor-alias text-xs opacity-40 hover:underline'}>
								{truncateHex(props.vaultData.address, 4)}
							</p>
						</Link>
					</span>
				</dd>

				<dt className={'text-sm opacity-80'}>{'Network'}</dt>
				<dd className={'col-span-2 text-right'}>
					<span className={'flex items-center justify-end gap-2'}>
						{'Optimism'}
						<ImageWithFallback
							src={'https://assets.smold.app/chain/10/logo-32.png'}
							alt={''}
							width={16}
							height={16}
						/>
					</span>
				</dd>
			</dl>
			<div className={'mx-auto mt-10 grid w-2/3 grid-cols-2 gap-2'}>
				<button
					onClick={() => props.onOpenWithdrawPopup()}
					className={cl(
						'mt-6 h-10 w-full rounded-lg bg-white font-medium text-purple',
						toBigInt(props.vaultData.balanceOf?.raw) === 0n ? 'invisible cursor-default' : ''
					)}>
					{'Withdraw'}
				</button>
				<button
					onClick={() => props.onOpenDepositPopup()}
					className={'mt-6 h-10 w-full rounded-lg bg-white font-medium text-purple'}>
					{'Deposit'}
				</button>
			</div>
		</div>
	);
}

export function VaultDetailsView(props: {vault: TVaultData; refetch: () => void}): ReactElement {
	const [isDepositPopupOpen, set_isDepositPopupOpen] = useState(false);
	const [isWithdrawPopupOpen, set_isWithdrawPopupOpen] = useState(false);
	const prizePool = usePrizePool(10, toAddress('0xF35fE10ffd0a9672d0095c435fd8767A7fe29B55'));
	const {data: yourBalanceInAssets} = useReadContract({
		abi: PRIZE_VAULT_ABI,
		address: props.vault.address,
		chainId: 10,
		functionName: 'convertToAssets',
		args: [props.vault.totalSupply.raw],
		query: {
			select(data) {
				return toNormalizedBN(data, props.vault.decimals);
			}
		}
	});

	const vault = useVault({
		chainId: 10,
		address: props.vault.address,
		decimals: props.vault.decimals,
		name: props.vault.name,
		symbol: props.vault.symbol
	});

	return (
		<>
			<div className={'pl-10'}>
				<Link href={'/'}>
					<small className={'text-white/40 transition-colors hover:text-white'}>{'← Back'}</small>
				</Link>
			</div>

			<DetailViewItem
				prizePool={prizePool}
				vault={vault}
				vaultData={props.vault}
				balanceOf={yourBalanceInAssets || zeroNormalizedBN}
				onOpenDepositPopup={() => set_isDepositPopupOpen(true)}
				onOpenWithdrawPopup={() => set_isWithdrawPopupOpen(true)}
			/>

			<DepositPopupWrapper
				prizePool={prizePool}
				vault={vault}
				vaultData={props.vault}
				isOpen={isDepositPopupOpen}
				onClose={() => {
					set_isDepositPopupOpen(false);
					props.refetch();
				}}
			/>
			<WithdrawPopupWrapper
				prizePool={prizePool}
				vault={vault}
				vaultData={props.vault}
				isOpen={isWithdrawPopupOpen}
				onClose={() => {
					set_isWithdrawPopupOpen(false);
					props.refetch();
				}}
			/>
		</>
	);
}
