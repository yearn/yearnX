import React, {useEffect, useState} from 'react';
import Image from 'next/image';
import {VaultBox} from 'components/VaultBox';
import {erc20Abi} from 'viem';
import {useBlockNumber} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {
	decodeAsAddress,
	decodeAsBigInt,
	decodeAsNumber,
	decodeAsString,
	toAddress,
	toNormalizedBN
} from '@builtbymom/web3/utils';
import {retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {PRIZE_VAULT_ABI} from '@utils/prizeVault.abi';
import {PRIZE_VAULT_FACTORY} from '@utils/prizeVaultFactory.abi';
import {readContract, readContracts} from '@wagmi/core';

import type {ReactElement} from 'react';
import type {TVaultData} from '@utils/types';

function Home(): ReactElement {
	const {address} = useWeb3();
	const {data: blockNumber} = useBlockNumber();
	const [vaults, set_vaults] = useState<TVaultData[] | undefined>(undefined);

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
				<div className={'poolGradient relative w-full overflow-hidden rounded-xl p-10'}>
					<p className={'font-mono opacity-65'}>{'FEELING LUCKY ANON?'}</p>
					<h1 className={'py-4 font-mono text-6xl uppercase text-white'}>{'Prize Vaults'}</h1>
					<p className={'font-mono opacity-65'}>{'TURN YIELD INTO PRIZES'}</p>
					<div className={'absolute inset-y-0 right-0 -mt-10 rotate-12'}>
						<Image
							src={
								'https://assets.smold.app/api/tokens/1/0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e/logo.svg'
							}
							className={'opacity-50'}
							alt={'Hero'}
							width={320}
							height={320}
						/>
					</div>
				</div>
			</div>
			<div className={'mb-10 grid grid-cols-2 gap-4 md:grid-cols-1'}>
				{vaults?.map(vault => (
					<VaultBox
						key={vault.address}
						vault={vault}
						refetch={refetch}
					/>
				))}
			</div>
		</section>
	);
}

export default function Wrapper(): ReactElement {
	return <Home />;
}
