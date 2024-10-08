export const PRIZE_VAULT_FACTORY = [
	{
		anonymous: false,
		inputs: [
			{indexed: true, internalType: 'contract PrizeVault', name: 'vault', type: 'address'},
			{indexed: true, internalType: 'contract IERC4626', name: 'yieldVault', type: 'address'},
			{indexed: true, internalType: 'contract PrizePool', name: 'prizePool', type: 'address'},
			{indexed: false, internalType: 'string', name: 'name', type: 'string'},
			{indexed: false, internalType: 'string', name: 'symbol', type: 'string'}
		],
		name: 'NewPrizeVault',
		type: 'event'
	},
	{
		inputs: [],
		name: 'YIELD_BUFFER',
		outputs: [{internalType: 'uint256', name: '', type: 'uint256'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{internalType: 'uint256', name: '', type: 'uint256'}],
		name: 'allVaults',
		outputs: [{internalType: 'contract PrizeVault', name: '', type: 'address'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{internalType: 'string', name: '_name', type: 'string'},
			{internalType: 'string', name: '_symbol', type: 'string'},
			{internalType: 'contract IERC4626', name: '_yieldVault', type: 'address'},
			{internalType: 'contract PrizePool', name: '_prizePool', type: 'address'},
			{internalType: 'address', name: '_claimer', type: 'address'},
			{internalType: 'address', name: '_yieldFeeRecipient', type: 'address'},
			{internalType: 'uint32', name: '_yieldFeePercentage', type: 'uint32'},
			{internalType: 'address', name: '_owner', type: 'address'}
		],
		name: 'deployVault',
		outputs: [{internalType: 'contract PrizeVault', name: '', type: 'address'}],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [{internalType: 'address', name: 'vault', type: 'address'}],
		name: 'deployedVaults',
		outputs: [{internalType: 'bool', name: 'deployedByFactory', type: 'bool'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{internalType: 'address', name: 'deployer', type: 'address'}],
		name: 'deployerNonces',
		outputs: [{internalType: 'uint256', name: 'nonce', type: 'uint256'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'totalVaults',
		outputs: [{internalType: 'uint256', name: '', type: 'uint256'}],
		stateMutability: 'view',
		type: 'function'
	}
] as const;
