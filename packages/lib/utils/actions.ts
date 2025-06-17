import {encodeFunctionData, erc20Abi} from 'viem';
import {assert, assertAddress, MAX_UINT_256, toBigInt} from '@lib/utils';
import {handleTx, retrieveConfig, toWagmiProvider} from '@lib/utils/wagmi';
import {readContract} from '@wagmi/core';

import {MULTICALL_ABI} from './multicall.abi.ts';
import {PRIZE_VAULT_ABI} from './prizeVault.abi';
import {VAULT_ABI} from './vault.abi';
import {YEARN_4626_ROUTER_ABI} from './vaultRouter.abi.ts';
import {VAULT_V2_ABI} from './vaultV2.abi.ts';

import type {EncodeFunctionDataReturnType, Hex} from 'viem';
import type {TAddress} from '@lib/types';
import type {TTxResponse, TWriteTransaction} from '@lib/utils/wagmi';

/**************************************************************************************************
 ** redeemV3Shares is a _WRITE_ function that withdraws a share of underlying collateral from a
 ** v3 vault.
 **
 ** @app - Vaults
 ** @param amount - The amount of ETH to withdraw.
 *************************************************************************************************/
type TRedeemV3Shares = TWriteTransaction & {
	amount: bigint;
};
export async function redeemV3Shares(props: TRedeemV3Shares): Promise<TTxResponse> {
	assert(props.amount > 0n, 'Amount is 0');
	assertAddress(props.contractAddress);
	const wagmiProvider = await toWagmiProvider(props.connector);
	assertAddress(wagmiProvider.address, 'wagmiProvider.address');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: PRIZE_VAULT_ABI,
		functionName: 'redeem',
		confirmation: 1,
		args: [props.amount, wagmiProvider.address, wagmiProvider.address, 1n] // 1n is 0.01% max_loss in BPS
	});
}

/**************************************************************************************************
 ** depositERC20 is a _WRITE_ function that deposits an ERC20 token into a vault.
 **
 ** @app - Vaults
 ** @param amount - The amount of ERC20 to deposit.
 *************************************************************************************************/
type TDepositArgs = TWriteTransaction & {
	amount: bigint;
};
export async function deposit(props: TDepositArgs): Promise<TTxResponse> {
	assert(props.amount > 0n, 'Amount is 0');
	assertAddress(props.contractAddress);
	const wagmiProvider = await toWagmiProvider(props.connector);
	assertAddress(wagmiProvider.address, 'wagmiProvider.address');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: VAULT_ABI,
		functionName: 'deposit',
		args: [props.amount, wagmiProvider.address]
	});
}

/**************************************************************************************************
 ** withdrawShares is a _WRITE_ function that withdraw an ERC20 token from a vault.
 **
 ** @app - Vaults
 ** @param amount - The amount of ERC20 to withdraw.
 *************************************************************************************************/
type TWithdrawSharesArgs = TWriteTransaction & {
	amount: bigint;
};
export async function withdrawShares(props: TWithdrawSharesArgs): Promise<TTxResponse> {
	assertAddress(props.contractAddress);
	assert(props.amount > 0n, 'Amount is 0');
	assert(props.connector, 'No connector');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: VAULT_V2_ABI,
		functionName: 'withdraw',
		args: [props.amount]
	});
}

/**************************************************************************************************
 ** depositViaRouter is a _WRITE_ function that deposits the chain Coin (eth/matic/etc.) to a vault
 ** via a set of specific operations.
 **
 ** @app - Vaults
 ** @param amount - The amount of ETH to deposit.
 ** @param token - The address of the token to deposit.
 ** @param vault - The address of the vault to deposit into.
 ** @param permitCalldata - The calldata for the permit
 ************************************************************************************************/
type TDepositViaRouter = TWriteTransaction & {
	amount: bigint;
	vault: TAddress;
	token: TAddress;
	permitCalldata?: EncodeFunctionDataReturnType;
};
export async function depositViaRouter(props: TDepositViaRouter): Promise<TTxResponse> {
	assert(props.amount > 0n, 'Amount is 0');
	assertAddress(props.contractAddress);
	const wagmiProvider = await toWagmiProvider(props.connector);
	assertAddress(wagmiProvider.address, 'wagmiProvider.address');
	const multicalls = [];

	/**********************************************************************************************
	 ** The depositToVault function requires a min share out. In our app, we will just use 99.99%
	 ** of the preview deposit. This is a common practice in the Yearn ecosystem
	 *********************************************************************************************/
	const previewDeposit = await readContract(retrieveConfig(), {
		address: props.vault,
		chainId: props.chainID,
		abi: VAULT_ABI,
		functionName: 'previewDeposit',
		args: [props.amount]
	});
	const minShareOut = (previewDeposit * 9999n) / 10000n;

	/**********************************************************************************************
	 ** We need to make sure that the Vault can spend the Underlying Token owned by the Yearn
	 ** Router. This is a bit weird and only need to be done once, but hey, this is required.
	 *********************************************************************************************/
	const allowance = await readContract(retrieveConfig(), {
		address: props.token,
		chainId: props.chainID,
		abi: erc20Abi,
		functionName: 'allowance',
		args: [props.contractAddress, props.vault]
	});
	if (toBigInt(allowance) < MAX_UINT_256) {
		multicalls.push(
			encodeFunctionData({
				abi: YEARN_4626_ROUTER_ABI,
				functionName: 'approve',
				args: [props.token, props.vault, MAX_UINT_256]
			})
		);
	}

	/**********************************************************************************************
	 ** Then we can prepare our multicall
	 *********************************************************************************************/
	if (props.permitCalldata) {
		multicalls.push(props.permitCalldata);
	}
	multicalls.push(
		encodeFunctionData({
			abi: YEARN_4626_ROUTER_ABI,
			functionName: 'depositToVault',
			args: [props.vault, props.amount, wagmiProvider.address, minShareOut]
		})
	);
	return await handleTx(props, {
		address: props.contractAddress,
		chainId: props.chainID,
		abi: YEARN_4626_ROUTER_ABI,
		functionName: 'multicall',
		value: 0n,
		args: [multicalls]
	});
}

export type TMulticall = TWriteTransaction & {
	multicallData: {
		target: TAddress;
		callData: Hex;
		value: bigint;
		allowFailure: boolean;
	}[];
};

export async function multicall(props: TMulticall): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.multicallData.length > 0, 'Nothing to do');
	assertAddress(props.contractAddress, 'ContractAddress');

	const value = props.multicallData.reduce((a: bigint, b: {value: bigint}): bigint => a + b.value, 0n);
	try {
		return await handleTx(props, {
			address: props.contractAddress,
			abi: MULTICALL_ABI,
			functionName: 'aggregate3Value',
			args: [props.multicallData],
			value: value
		});
	} catch (err) {
		console.log(err);
	}
	return await handleTx(props, {
		address: props.contractAddress,
		abi: MULTICALL_ABI,
		functionName: 'aggregate3Value',
		args: [props.multicallData],
		value: value
	});
}
