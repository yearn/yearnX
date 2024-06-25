import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
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
import {VaultDetailsView} from '@lib/components/VaultDetailsView';
import {PRIZE_VAULT_ABI} from '@lib/utils/prizeVault.abi';
import {readContracts} from '@wagmi/core';

import type {GetServerSideProps} from 'next';
import type {ReactElement} from 'react';
import type {TVaultData} from '@lib/utils/types';

export default function Vault(): ReactElement {
	const router = useRouter();
	const {address} = useWeb3();
	const {data: blockNumber} = useBlockNumber();
	const [vault, set_vault] = useState<TVaultData | undefined>(undefined);

	const refetch = useAsyncTrigger(async () => {
		const vaultAddress = toAddress(router.query.address as string);

		// Then, we have the addresses of all the vaults, we can fetch the data for each one (name, symbol, decimals)
		const vaultData = await readContracts(retrieveConfig(), {
			contracts: [
				{
					abi: erc20Abi,
					address: vaultAddress,
					functionName: 'name',
					chainId: 10
				},
				{
					abi: erc20Abi,
					address: vaultAddress,
					functionName: 'symbol',
					chainId: 10
				},
				{
					abi: erc20Abi,
					address: vaultAddress,
					functionName: 'decimals',
					chainId: 10
				},
				{
					abi: erc20Abi,
					address: vaultAddress,
					functionName: 'totalSupply',
					chainId: 10
				},
				{
					abi: erc20Abi,
					address: vaultAddress,
					functionName: 'balanceOf',
					chainId: 10,
					args: [toAddress(address)]
				},
				{
					abi: PRIZE_VAULT_ABI,
					address: vaultAddress,
					functionName: 'asset',
					args: [],
					chainId: 10
				}
			]
		});

		const name = decodeAsString(vaultData[0]);
		const symbol = decodeAsString(vaultData[1]);
		const decimals = decodeAsNumber(vaultData[2]);
		const totalSupply = toNormalizedBN(decodeAsBigInt(vaultData[3]), decimals);
		const balance = toNormalizedBN(decodeAsBigInt(vaultData[4]), decimals);
		const assetAddress = decodeAsAddress(vaultData[5]);
		const vaultsData = {
			name,
			symbol,
			decimals,
			address: vaultAddress,
			totalSupply,
			assetAddress,
			assetName: '',
			assetSymbol: '',
			balanceOf: balance
		};

		const assetsDataCalls = [];
		assetsDataCalls.push({
			abi: erc20Abi,
			address: vaultsData.assetAddress,
			functionName: 'name',
			chainId: 10
		});
		assetsDataCalls.push({
			abi: erc20Abi,
			address: vaultsData.assetAddress,
			functionName: 'symbol',
			chainId: 10
		});

		const assetsData = await readContracts(retrieveConfig(), {contracts: assetsDataCalls});
		vaultsData.assetName = decodeAsString(assetsData[0]);
		vaultsData.assetSymbol = decodeAsString(assetsData[1]);
		set_vault(vaultsData);
	}, [address, router.query.address]);

	/**********************************************************************************************
	 ** As we want live data, we want the data to be refreshed every time the block number changes.
	 ** This way, the user will always have the most up-to-date data.
	 **********************************************************************************************/
	useEffect(() => {
		refetch();
	}, [blockNumber, refetch]);

	return (
		<section className={'mx-auto mt-0 grid w-full max-w-6xl'}>
			<div className={'mb-10 grid grid-cols-2 gap-4 md:grid-cols-1'}>
				{vault && (
					<VaultDetailsView
						vault={vault}
						refetch={refetch}
					/>
				)}
			</div>
		</section>
	);
}

export const getServerSideProps = (async () => ({props: {}})) satisfies GetServerSideProps;
