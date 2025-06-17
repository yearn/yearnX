/* eslint-disable object-curly-newline */
'use client';

import {defineChain} from 'viem';
import {arbitrum, base, fantom, gnosis, mainnet, optimism, polygon} from 'viem/chains';
import {toAddress} from '@lib/utils';

import type {Chain} from 'viem/chains';
import type {TAddress, TNDict} from '@lib/types';

type TSmolChains = TNDict<
	Chain & {
		coingeckoGasCoinID: string;
		llamaChainName?: string;
		yearnRouterAddress: TAddress | undefined;
		bgColor?: string;
	}
>;

type TAssignRPCUrls = {
	default: {
		http: string[];
	};
};

const katana = /*#__PURE__*/ defineChain({
	id: 747474,
	name: 'Katana',
	nativeCurrency: {
		decimals: 18,
		name: 'Ether',
		symbol: 'ETH'
	},
	rpcUrls: {
		default: {http: ['https://rpc.katanarpc.com']}
	},
	blockExplorers: {
		default: {
			name: 'Katana Explorer',
			url: 'https://explorer.katanarpc.com'
		}
	},
	contracts: {
		multicall3: {
			address: '0xcA11bde05977b3631167028862bE2a173976CA11',
			blockCreated: 1898013
		}
	},
	testnet: false
});

export function assignRPCUrls(chain: Chain, rpcUrls?: string[]): TAssignRPCUrls {
	const availableRPCs: string[] = [];

	const newRPC = process.env.RPC_URI_FOR?.[chain.id] || '';
	const newRPCBugged = process.env[`RPC_URI_FOR_${chain.id}`];
	const oldRPC = process.env.JSON_RPC_URI?.[chain.id] || process.env.JSON_RPC_URL?.[chain.id];
	const defaultJsonRPCURL = chain?.rpcUrls?.public?.http?.[0];
	const injectedRPC = newRPC || oldRPC || newRPCBugged || defaultJsonRPCURL || '';
	if (injectedRPC) {
		availableRPCs.push(injectedRPC);
	}
	if (chain.rpcUrls['alchemy']?.http[0] && process.env.ALCHEMY_KEY) {
		availableRPCs.push(`${chain.rpcUrls['alchemy']?.http[0]}/${process.env.ALCHEMY_KEY}`);
	}
	if (chain.rpcUrls['infura']?.http[0] && process.env.INFURA_PROJECT_ID) {
		availableRPCs.push(`${chain.rpcUrls['infura']?.http[0]}/${process.env.INFURA_PROJECT_ID}`);
	}

	/**********************************************************************************************
	 ** Make sure to add a proper http object to the chain.rpcUrls.default object.
	 ********************************************************************************************/
	const http = [];
	if (rpcUrls?.length) {
		http.push(...rpcUrls);
	}
	if (injectedRPC) {
		http.push(injectedRPC);
	}
	if (availableRPCs.length) {
		http.push(...availableRPCs);
	}
	http.push(...chain.rpcUrls.default.http);
	return {
		...chain.rpcUrls,
		default: {http}
	};
}

const CHAINS: TSmolChains = {
	[mainnet.id]: {
		...mainnet,
		coingeckoGasCoinID: 'ethereum',
		llamaChainName: 'ethereum',
		rpcUrls: assignRPCUrls(mainnet),
		yearnRouterAddress: toAddress('0x1112dbcf805682e828606f74ab717abf4b4fd8de'),
		bgColor: '#253d6b'
	},
	[optimism.id]: {
		...optimism,
		name: 'Optimism',
		coingeckoGasCoinID: 'ethereum',
		llamaChainName: 'optimism',
		rpcUrls: assignRPCUrls(optimism),
		yearnRouterAddress: toAddress('0x1112dbcf805682e828606f74ab717abf4b4fd8de'),
		bgColor: '#6b212b'
	},
	[gnosis.id]: {
		...gnosis,
		coingeckoGasCoinID: 'xdai',
		llamaChainName: 'xdai',
		rpcUrls: assignRPCUrls(gnosis),
		yearnRouterAddress: toAddress('0x1112dbcf805682e828606f74ab717abf4b4fd8de'),
		bgColor: '#0b4d0f'
	},
	[polygon.id]: {
		...polygon,
		coingeckoGasCoinID: 'matic-network',
		llamaChainName: 'polygon',
		rpcUrls: assignRPCUrls(polygon),
		yearnRouterAddress: toAddress('0x1112dbcf805682e828606f74ab717abf4b4fd8de'),
		bgColor: '#320a36'
	},
	[fantom.id]: {
		...fantom,
		coingeckoGasCoinID: 'fantom',
		llamaChainName: 'fantom',
		rpcUrls: assignRPCUrls(fantom),
		yearnRouterAddress: undefined
	},
	[base.id]: {
		...base,
		coingeckoGasCoinID: 'ethereum',
		llamaChainName: 'base',
		rpcUrls: assignRPCUrls(base),
		yearnRouterAddress: toAddress('0x1112dbcf805682e828606f74ab717abf4b4fd8de'),
		bgColor: '#1e2e87'
	},
	[arbitrum.id]: {
		...arbitrum,
		coingeckoGasCoinID: 'ethereum',
		llamaChainName: 'arbitrum',
		rpcUrls: assignRPCUrls(arbitrum),
		yearnRouterAddress: toAddress('0x1112dbcf805682e828606f74ab717abf4b4fd8de'),
		bgColor: '#424240'
	},
	[katana.id]: {
		...katana,
		coingeckoGasCoinID: 'ethereum',
		llamaChainName: 'katana',
		rpcUrls: assignRPCUrls(katana),
		yearnRouterAddress: toAddress(''),
		bgColor: '#694a11'
	}
};

const supportedNetworks: Chain[] = Object.values(CHAINS).filter(e => !e.testnet);
const supportedTestNetworks: Chain[] = Object.values(CHAINS).filter(e => e.testnet);

export {CHAINS, supportedNetworks, supportedTestNetworks};
