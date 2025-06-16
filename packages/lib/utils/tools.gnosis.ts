import {encodeFunctionCall} from 'web3-eth-abi';

import type {BaseTransaction} from '@gnosis.pm/safe-apps-sdk';
import type {TAddress} from '@lib/types';

const ERC20ABI_APPROVE = {
	type: 'function',
	name: 'approve',
	stateMutability: 'nonpayable',
	inputs: [
		{name: 'spender', type: 'address'},
		{name: 'amount', type: 'uint256'}
	],
	outputs: [{name: '', type: 'bool'}]
} as const;

export function getApproveTransaction(amount: string, token: TAddress, spender: TAddress): BaseTransaction {
	return {to: token, value: '0', data: encodeFunctionCall(ERC20ABI_APPROVE, [spender, amount])};
}

const VAULT_ABI = {
	stateMutability: 'nonpayable',
	type: 'function',
	name: 'deposit',
	inputs: [
		{name: '_amount', type: 'uint256'},
		{name: 'recipient', type: 'address'}
	],
	outputs: [{name: '', type: 'uint256'}]
} as const;

export function getDepositTransaction(contractAddress: TAddress, amount: string, owner: TAddress): BaseTransaction {
	return {to: contractAddress, value: '0', data: encodeFunctionCall(VAULT_ABI, [amount, owner])};
}
