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
		name: 'Yearn X Aerodrome',
		description: 'Take a flight with the Yearn X Aerodrome Vaults',
		icon: 'https://aerodrome.yearn.space/favicons/favicon-512x512.png',
		vaultType: 'v2',
		url: 'https://aerodrome.yearn.space'
	},
	{
		name: 'Yearn X Ajna',
		description: 'Embrace the yield with no Oracles with Yearn X Ajna Vaults',
		icon: 'https://ajna.yearn.space/favicons/favicon-512x512.png',
		vaultType: 'v2',
		url: 'https://ajna.yearn.space'
	},
	{
		name: 'Yearn X Curve',
		description: 'Discover the fanciest yVaults with Curve',
		icon: 'https://curve.yearn.space/favicons/favicon-512x512.png',
		vaultType: 'v2',
		url: 'https://curve.yearn.space'
	},
	{
		name: 'Yearn X Pendle',
		description: 'Hop on the Yield Express with the Yearn X Pendle Vaults',
		icon: 'https://pendle.yearn.space/favicons/favicon-512x512.png',
		vaultType: 'v2',
		url: 'https://pendle.yearn.space'
	},
	{
		name: 'Yearn X PoolTogether',
		description: 'Feeling lucky Anon?',
		icon: 'https://pooltogether.yearn.space/favicons/favicon-512x512.png',
		vaultType: 'v2',
		url: 'https://pooltogether.yearn.space'
	},
	{
		name: 'Yearn X Velodrome',
		description: 'Earn the yellow jersey or Yield with the Yearn X Velodrome Vaults',
		icon: 'https://velodrome.yearn.space/favicons/favicon-512x512.png',
		vaultType: 'v2',
		url: 'https://velodrome.yearn.space'
	}
	// {
	// 	name: 'Yearn X ',
	// 	description: 'Pooltogether description lines',
	// 	icon: '',
	// 	vaultType: 'v2',
	// 	url: ''
	// },
	// {
	// 	name: 'PoolTogether2',
	// 	description: 'Pooltogether description lines',
	// 	icon: '',
	// 	vaultType: 'v3',
	// 	url: ''
	// },
	// {
	// 	name: 'PoolTogether3',
	// 	description: 'Pooltogether description lines',
	// 	icon: '',
	// 	vaultType: 'others',
	// 	url: ''
	// },
	// {
	// 	name: 'PoolTogether4',
	// 	description: 'Pooltogether description lines',
	// 	icon: '',
	// 	vaultType: 'v3',
	// 	url: ''
	// },
	// {
	// 	name: 'PoolTogether5',
	// 	description: 'Pooltogether description lines',
	// 	icon: '',
	// 	vaultType: 'others',
	// 	url: ''
	// },
	// {
	// 	name: 'PoolTogether6',
	// 	description: 'Pooltogether description lines',
	// 	icon: '',
	// 	vaultType: 'v3',
	// 	url: ''
	// },
	// {
	// 	name: 'PoolTogether7',
	// 	description: 'Pooltogether description lines',
	// 	icon: '',
	// 	vaultType: 'v2',
	// 	url: ''
	// }
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
