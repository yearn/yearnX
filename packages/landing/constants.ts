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
		name: 'Yearn X PoolTogether',
		description: 'Feeling lucky Anon?',
		icon: 'https://pooltogether.yearn.space/partnerLogo.png',
		vaultType: 'v2',
		url: 'https://pooltogether.yearn.space'
	},
	{
		name: 'Yearn X Optimism',
		description: 'Discover the fanciest yVaults on Optimism',
		icon: 'https://optimism.yearn.space/partnerLogo.svg',
		vaultType: 'v2',
		url: 'https://optimism.yearn.space'
	},
	{
		name: 'Yearn X Pendle',
		description: 'Hop on the Yield Express with the Yearn X Pendle Vaults',
		icon: 'https://pendle.yearn.space/partnerLogo.png',
		vaultType: 'v2',
		url: 'https://pendle.yearn.space'
	},
	{
		name: 'Yearn X Ajna',
		description: 'Embrace the yield with no Oracles with Yearn X Ajna Vaults',
		icon: 'https://assets.smold.app/api/token/1/0x9a96ec9B57Fb64FbC60B423d1f4da7691Bd35079/logo-128.png',
		vaultType: 'v2',
		url: 'https://juiced.app'
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
