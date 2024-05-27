import React, {useEffect, useState} from 'react';
import {VaultBox} from 'components/VaultBox';
import {erc20Abi} from 'viem';
import {useBlockNumber} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {
	cl,
	decodeAsAddress,
	decodeAsBigInt,
	decodeAsNumber,
	decodeAsString,
	toAddress,
	toBigInt,
	toNormalizedBN
} from '@builtbymom/web3/utils';
import {retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {useGrandPrize, usePrizePool} from '@generationsoftware/hyperstructure-react-hooks';
import {PRIZE_VAULT_ABI} from '@utils/prizeVault.abi';
import {PRIZE_VAULT_FACTORY} from '@utils/prizeVaultFactory.abi';
import {readContract, readContracts} from '@wagmi/core';
import {Counter} from '@common/Counter';

import type {ReactElement} from 'react';
import type {TVaultData} from '@utils/types';

function Home(): ReactElement {
	const {address} = useWeb3();
	const {data: blockNumber} = useBlockNumber();
	const [vaults, set_vaults] = useState<TVaultData[] | undefined>(undefined);
	const prizePool = usePrizePool(10, toAddress('0xF35fE10ffd0a9672d0095c435fd8767A7fe29B55'));
	const {data: grandPrize} = useGrandPrize(prizePool);

	const refetch = useAsyncTrigger(async () => {
		// Fetch the number of vaults
		const numberOfVaults = await readContract(retrieveConfig(), {
			abi: PRIZE_VAULT_FACTORY,
			address: toAddress('0x0c379e9b71ba7079084ada0d1c1aeb85d24dfd39'),
			functionName: 'totalVaults',
			chainId: 10
		});

		// Then fetch all the vaults in a multi-call
		const calls = [];
		for (let i = 0; i < numberOfVaults; i++) {
			calls.push({
				abi: PRIZE_VAULT_FACTORY,
				address: toAddress('0x0c379e9b71ba7079084ada0d1c1aeb85d24dfd39'),
				functionName: 'allVaults',
				args: [i],
				chainId: 10
			});
		}
		const allVaults = await readContracts(retrieveConfig(), {contracts: calls});

		// Then, we have the addresses of all the vaults, we can fetch the data for each one (name, symbol, decimals)
		const vaultData = await readContracts(retrieveConfig(), {
			contracts: [
				...allVaults.map(vault => ({
					abi: erc20Abi,
					address: decodeAsAddress(vault),
					functionName: 'name',
					chainId: 10
				})),
				...allVaults.map(vault => ({
					abi: erc20Abi,
					address: decodeAsAddress(vault),
					functionName: 'symbol',
					chainId: 10
				})),
				...allVaults.map(vault => ({
					abi: erc20Abi,
					address: decodeAsAddress(vault),
					functionName: 'decimals',
					chainId: 10
				})),
				...allVaults.map(vault => ({
					abi: erc20Abi,
					address: decodeAsAddress(vault),
					functionName: 'totalSupply',
					chainId: 10
				})),
				...allVaults.map(vault => ({
					abi: erc20Abi,
					address: decodeAsAddress(vault),
					functionName: 'balanceOf',
					chainId: 10,
					args: [toAddress(address)]
				})),
				...allVaults.map(vault => ({
					abi: PRIZE_VAULT_ABI,
					address: decodeAsAddress(vault),
					functionName: 'asset',
					args: [],
					chainId: 10
				}))
			] as any[]
		});

		const allVaultsData: TVaultData[] = [];
		for (let i = 0; i < Number(numberOfVaults); i++) {
			const address = decodeAsAddress(allVaults[i]);
			const name = decodeAsString(vaultData[i]);
			const symbol = decodeAsString(vaultData[i + Number(numberOfVaults)]);
			const decimals = decodeAsNumber(vaultData[i + Number(numberOfVaults) * 2]);
			const totalSupply = toNormalizedBN(decodeAsBigInt(vaultData[i + Number(numberOfVaults) * 3]), decimals);
			const balance = toNormalizedBN(decodeAsBigInt(vaultData[i + Number(numberOfVaults) * 4]), decimals);
			const assetAddress = decodeAsAddress(vaultData[i + Number(numberOfVaults) * 5]);
			if (!name.includes('Yearn')) {
				continue;
			}
			//Error deployment
			if (toAddress(address) === toAddress('0x3a14DdB934e785Cd1e29949EA814e8090D5F8b69')) {
				continue;
			}
			if (toAddress(address) === toAddress('0x37E49c9dBf195F5D436C7A7610fe703cDcd8147B')) {
				continue;
			}
			allVaultsData.push({
				name,
				symbol,
				decimals,
				address,
				totalSupply,
				assetAddress,
				assetName: '',
				assetSymbol: '',
				balanceOf: balance
			});
		}

		const assetsDataCalls = [];
		for (const vault of allVaultsData) {
			assetsDataCalls.push({
				abi: erc20Abi,
				address: vault.assetAddress,
				functionName: 'name',
				chainId: 10
			});
			assetsDataCalls.push({
				abi: erc20Abi,
				address: vault.assetAddress,
				functionName: 'symbol',
				chainId: 10
			});
		}
		const assetsData = await readContracts(retrieveConfig(), {contracts: assetsDataCalls});
		for (let i = 0; i < allVaultsData.length; i++) {
			allVaultsData[i].assetName = decodeAsString(assetsData[i * 2]);
			allVaultsData[i].assetSymbol = decodeAsString(assetsData[i * 2 + 1]);
		}
		set_vaults(allVaultsData);
	}, [address]);

	/**********************************************************************************************
	 ** As we want live data, we want the data to be refreshed every time the block number changes.
	 ** This way, the user will always have the most up-to-date data.
	 **********************************************************************************************/
	useEffect(() => {
		refetch();
	}, [blockNumber, refetch]);

	return (
		<section className={'mx-auto grid w-full max-w-6xl'}>
			<div className={'mb-10 mt-6'}>
				<div
					className={cl(
						'flex w-full md:w-[480px] flex-col gap-2 rounded-2xl bg-[#FF00F5] p-6 backdrop-blur-md shadow-xl',
						'text-center mx-auto'
					)}>
					<p className={'text-lg font-bold uppercase text-white'}>{'GRAND PRIZE'}</p>
					<span>
						<b className={'text-[64px] leading-[72px]'}>
							<Counter
								value={
									toNormalizedBN(toBigInt(grandPrize?.amount), grandPrize?.decimals || 18).normalized
								}
								decimals={grandPrize?.decimals || 18}
								decimalsToDisplay={[2, 4, 6, 8]}
								idealDecimals={2}
							/>
						</b>
						<span className={'text-xl text-white/65'}>{` ${grandPrize?.symbol || ''}`}</span>
					</span>
				</div>
			</div>

			<div className={'mb-10 rounded-2xl bg-transparent p-0 md:bg-[#441F93] md:p-10'}>
				<div className={'hidden pb-10 md:block'}>
					<div className={'grid grid-cols-9 gap-6'}>
						<p className={'col-span-2 pl-2 text-sm text-white/65'}>{'Prize vault'}</p>
						<div className={'col-span-5 grid grid-cols-4 gap-2'}>
							<p className={'text-sm text-white/65'}>{'Prize Yield'}</p>
							<p className={'text-sm text-white/65'}>{'Rewards'}</p>
							<p className={'text-sm text-white/65'}>{'Total deposits'}</p>
							<p className={'text-sm text-white/65'}>{'My balance'}</p>
						</div>
						<p className={'col-span-2 pr-6 text-center text-sm text-white/65'}>{'Manage'}</p>
					</div>
				</div>
				<div className={'grid grid-cols-2 gap-2 md:grid-cols-1'}>
					{(vaults || [])?.map(vault => (
						<VaultBox
							key={vault.address}
							vault={vault}
							refetch={refetch}
						/>
					))}
				</div>
			</div>
		</section>
	);
}

export default function Wrapper(): ReactElement {
	return <Home />;
}
