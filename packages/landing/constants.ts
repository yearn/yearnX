import type {TPartners, TTab} from './types';

export const COLORS = {
	regularText: '#FFFFFF',
	button: '#0657F9',
	background: '#0C0C0C', // The background color of the page
	'card-bg': '#121212', // The background color of the Partner's card
	fallback: '#ccc' // The image fallback color
};

export const PARTNERS_PER_PAGE = 16;

export const PARTNERS: TPartners = [
	{
		name: 'PoolTogether',
		description: 'Pooltogether description lines',
		icon: '',
		vaultType: 'v2'
	},
	{
		name: 'Optimism',
		description: 'Optimism description lines',
		icon: '',
		vaultType: 'v2'
	},
	{
		name: 'Pendle',
		description: 'Pendle description lines',
		icon: '',
		vaultType: 'v2'
	},
	{
		name: 'Ajna',
		description: 'Ajna description lines',
		icon: '',
		vaultType: 'v2'
	},
	{
		name: 'PoolTogether1',
		description: 'Pooltogether description lines',
		icon: '',
		vaultType: 'v2'
	},
	{
		name: 'PoolTogether2',
		description: 'Pooltogether description lines',
		icon: '',
		vaultType: 'v3'
	},
	{
		name: 'PoolTogether3',
		description: 'Pooltogether description lines',
		icon: '',
		vaultType: 'others'
	},
	{
		name: 'PoolTogether4',
		description: 'Pooltogether description lines',
		icon: '',
		vaultType: 'v3'
	},
	{
		name: 'PoolTogether5',
		description: 'Pooltogether description lines',
		icon: '',
		vaultType: 'others'
	},
	{
		name: 'PoolTogether6',
		description: 'Pooltogether description lines',
		icon: '',
		vaultType: 'v3'
	},
	{
		name: 'PoolTogether7',
		description: 'Pooltogether description lines',
		icon: '',
		vaultType: 'v2'
	}
];

export const TABS: TTab[] = [
	{
		label: 'All',
		value: 'all'
	},
	{
		label: 'v2',
		value: 'v2'
	},
	{
		label: 'v3',
		value: 'v3'
	},
	{
		label: 'Others',
		value: 'others'
	}
];
