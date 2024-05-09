import React, {useState} from 'react';
import Link from 'next/link';
import {DepositPopupWrapper} from 'components/DepositModal';
import {cl, formatAmount, toAddress, toBigInt, truncateHex} from '@builtbymom/web3/utils';
import {getNetwork} from '@builtbymom/web3/utils/wagmi';
import {
	usePrizePool,
	useVault,
	useVaultPrizeYield,
	useVaultPromotionsApr
} from '@generationsoftware/hyperstructure-react-hooks';
import {Counter} from '@common/Counter';
import {ImageWithFallback} from '@common/ImageWithFallback';

import {WithdrawPopupWrapper} from './WithdrawModal';

import type {ReactElement} from 'react';
import type {PrizePool, Vault} from '@generationsoftware/hyperstructure-client-js';
import type {TVaultData} from '@utils/types';

export function GridViewItem(props: {
	vault: Vault;
	vaultData: TVaultData;
	prizePool: PrizePool;
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
	return (
		<div className={'poolGradient grid rounded-xl p-6 pt-4'}>
			<div className={'-ml-2 pb-2'}>
				<div className={'flex w-fit items-center gap-2 rounded-md bg-white/20 p-2 backdrop-blur-md'}>
					<ImageWithFallback
						src={`https://assets.smold.app/tokens/10/${props.vaultData.assetAddress}/logo-32.png`}
						alt={props.vaultData.assetSymbol}
						width={28}
						height={28}
					/>
					{props.vaultData.name}
					<p className={'text-xs opacity-40'}>{`${props.vaultData.symbol}`}</p>
				</div>
			</div>
			<dl className={'grid grid-cols-3 gap-y-2'}>
				<dt className={'text-sm opacity-80'}>{'Prize Yield'}</dt>
				<dd className={'col-span-2 text-right'}>{`${formatAmount(Number(prizeYield), 2, 2)}%`}</dd>

				<dt className={'whitespace-nowrap text-sm opacity-80'}>{'Promotions APR'}</dt>
				<dd className={'col-span-2 text-right'}>{`${formatAmount(Number(promoAPR), 2, 2)}%`}</dd>

				{toBigInt(props.vaultData.balanceOf.raw) > 0n ? (
					<>
						<dt className={'text-sm opacity-80'}>{'Your balance'}</dt>
						<dd className={'col-span-2 text-right'}>
							<Counter
								value={props.vaultData.balanceOf.normalized}
								decimals={props.vaultData.decimals}
								idealDecimals={2}
								decimalsToDisplay={[2, 4, 6, 8]}
							/>
							<p className={'inline text-xs opacity-40'}>{` ${props.vaultData.assetSymbol}`}</p>
						</dd>
					</>
				) : null}

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
						<ImageWithFallback
							src={`https://assets.smold.app/tokens/10/${props.vaultData.assetAddress}/logo-32.png`}
							alt={props.vaultData.assetSymbol}
							width={16}
							height={16}
						/>
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
						<ImageWithFallback
							src={`https://assets.smold.app/tokens/10/${props.vaultData.assetAddress}/logo-32.png`}
							alt={props.vaultData.symbol}
							width={16}
							height={16}
						/>
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
			</dl>
			<div className={'grid grid-cols-2 gap-2'}>
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

export function ListViewItem(props: {
	vault: Vault;
	vaultData: TVaultData;
	prizePool: PrizePool;
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
	return (
		<div className={'poolGradient grid grid-cols-9 gap-4 rounded-xl p-4'}>
			<div className={'col-span-2'}>
				<div className={'flex w-full items-center gap-2 rounded-lg bg-white/20 p-2 backdrop-blur-md'}>
					<ImageWithFallback
						src={`https://assets.smold.app/tokens/10/${props.vaultData.assetAddress}/logo-32.png`}
						alt={props.vaultData.assetSymbol}
						width={28}
						height={28}
					/>
					<div className={'truncate'}>
						<p className={'truncate'}>{props.vaultData.name}</p>
						<p className={'text-xs opacity-40'}>{`${props.vaultData.symbol}`}</p>
					</div>
				</div>
			</div>

			<dl className={'col-span-5 grid grid-cols-4 gap-2'}>
				<div>
					<dt className={'text-xs opacity-60'}>{'Prize Yield'}</dt>
					<dd className={'col-span-2 text-left'}>{`${formatAmount(Number(prizeYield), 2, 2)}%`}</dd>
				</div>

				<div>
					<dt className={'text-xs opacity-60'}>{'Promotions APR'}</dt>
					<dd className={'col-span-2 text-left'}>{`${formatAmount(Number(promoAPR), 2, 2)}%`}</dd>
				</div>

				<div>
					<dt className={'text-xs opacity-60'}>{'Your balance'}</dt>
					<dd className={'col-span-2 flex flex-row items-center gap-2 text-left'}>
						<div className={''}>
							<Counter
								value={props.vaultData.balanceOf.normalized}
								decimals={props.vaultData.decimals}
								idealDecimals={2}
								decimalsToDisplay={[2, 4, 6, 8]}
							/>
						</div>
						<div className={'w-full truncate pt-1 text-xs opacity-40'}>
							<p className={'inline'}>{` ${props.vaultData.assetSymbol}`}</p>
						</div>
					</dd>
				</div>

				<div>
					<dt className={'text-xs opacity-60'}>{'Total Supply'}</dt>
					<dd className={'col-span-2 flex flex-row items-center gap-2 text-left'}>
						<Counter
							value={props.vaultData.totalSupply.normalized}
							decimals={props.vaultData.decimals}
							idealDecimals={2}
							decimalsToDisplay={[2, 4, 6, 8]}
						/>
						<div className={'w-full truncate pt-1 text-xs opacity-40'}>
							<p className={'inline'}>{` ${props.vaultData.assetSymbol}`}</p>
						</div>
					</dd>
				</div>
			</dl>

			<div className={'col-span-2 grid grid-cols-2 items-center justify-center gap-x-2'}>
				<button
					onClick={() => props.onOpenWithdrawPopup()}
					className={cl(
						'h-8 w-full px-2 text-sm rounded-lg bg-white font-medium text-purple transition-opacity',
						toBigInt(props.vaultData.balanceOf?.raw) === 0n ? 'opacity-0 cursor-default' : 'opacity-100'
					)}>
					{'Withdraw'}
				</button>
				<button
					onClick={() => props.onOpenDepositPopup()}
					className={'h-8 w-full rounded-lg bg-white px-2 text-sm font-medium text-purple'}>
					{'Deposit'}
				</button>
			</div>
		</div>
	);
}

export function VaultBox(props: {vault: TVaultData; refetch: () => void}): ReactElement {
	const [isDepositPopupOpen, set_isDepositPopupOpen] = useState(false);
	const [isWithdrawPopupOpen, set_isWithdrawPopupOpen] = useState(false);
	const prizePool = usePrizePool(10, toAddress('0xF35fE10ffd0a9672d0095c435fd8767A7fe29B55'));
	const vault = useVault({
		chainId: 10,
		address: props.vault.address,
		decimals: props.vault.decimals,
		name: props.vault.name,
		symbol: props.vault.symbol
	});

	return (
		<>
			<div className={'grid md:hidden'}>
				<GridViewItem
					prizePool={prizePool}
					vault={vault}
					vaultData={props.vault}
					onOpenDepositPopup={() => set_isDepositPopupOpen(true)}
					onOpenWithdrawPopup={() => set_isWithdrawPopupOpen(true)}
				/>
			</div>
			<div className={'hidden md:grid'}>
				<ListViewItem
					prizePool={prizePool}
					vault={vault}
					vaultData={props.vault}
					onOpenDepositPopup={() => set_isDepositPopupOpen(true)}
					onOpenWithdrawPopup={() => set_isWithdrawPopupOpen(true)}
				/>
			</div>

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
