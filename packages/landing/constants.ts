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
		description: 'Liftoff for great yields, with Aerodrome on Yearn.',
		icon: 'https://aerodrome.yearn.space/favicons/favicon-512x512.png',
		vaultType: 'v2',
		url: 'https://aerodrome.yearn.space'
	},
	{
		name: 'Yearn X Ajna',
		description: 'No oracles, no governance, just great yields.',
		icon: 'https://ajna.yearn.space/favicons/favicon-512x512.png',
		vaultType: 'v2',
		url: 'https://ajna.yearn.space'
	},
	{
		name: 'Yearn X Curve',
		description: "If it's on Curve, you'll get the best max boosted yields with Yearn.",
		icon: 'https://curve.yearn.space/favicons/favicon-512x512.png',
		vaultType: 'v2',
		url: 'https://curve.yearn.space'
	},
	{
		name: 'Yearn X Pendle',
		description: 'The best Pendle yields with auto-rolling tech.',
		icon: 'https://pendle.yearn.space/favicons/favicon-512x512.png',
		vaultType: 'v2',
		url: 'https://pendle.yearn.space'
	},
	{
		name: 'Yearn X PoolTogether',
		description: 'Feeling lucky Anon? Win mega yield payouts with prize Vaults.',
		icon: 'https://pooltogether.yearn.space/favicons/favicon-512x512.png',
		vaultType: 'v2',
		url: 'https://pooltogether.yearn.space'
	},
	{
		name: 'Yearn X Velodrome',
		description: 'Wear the yield yellow jersey with Velodrome.',
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
