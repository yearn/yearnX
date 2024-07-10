import {assert, assertAddress} from '@builtbymom/web3/utils';
import {handleTx, toWagmiProvider} from '@builtbymom/web3/utils/wagmi';

import {PRIZE_VAULT_ABI} from './prizeVault.abi';
import {VAULT_ABI} from './vault.abi';

import type {TTxResponse, TWriteTransaction} from '@builtbymom/web3/utils/wagmi';

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
export async function depositERC20(props: TDepositArgs): Promise<TTxResponse> {
	assertAddress(props.contractAddress);
	assert(props.amount > 0n, 'Amount is 0');
	assert(props.connector, 'No connector');

	const wagmiProvider = await toWagmiProvider(props.connector);
	return await handleTx(props, {
		address: props.contractAddress,
		abi: PRIZE_VAULT_ABI,
		functionName: 'deposit',
		confirmation: 1,
		args: [props.amount, wagmiProvider.address]
	});
}

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
		abi: VAULT_ABI,
		functionName: 'withdraw',
		args: [props.amount]
	});
}
