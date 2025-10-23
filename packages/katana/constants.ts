import type {TAPYType} from '@lib/utils/types';

export const PROJECT_TITLE = 'Yearn x Katana';
export const PROJECT_DESCRIPTION = 'Welcome to the Dojo';
export const VARIANT_TO_USE = 7;
export const VAULT_FILTER = 'katana';
export const VAULTS_PER_PAGE = 20;
export const APY_TYPE: TAPYType = 'ESTIMATED';

export const COLORS = {
	button: '#2973FF', // The main color of the button
	buttonHover: '#2973FFf2', // The hover color of the button
	regularText: '#FFFFFFb3', // The color of the regular text
	accentText: '#FFFFFF', // The color of the text on the button or the primary color
	background: '#15181A', // The background color of the page
	table: '#222529', // The background color of the table (front element)
	primary: '#FFFFFF', // The primary color of the page
	secondary: '#FFFFFF80', // The secondary color of the page
	headerTag: '#FFFFFF' // The color of the header tag [Yearn x Something]
};

export const AUSD_VAULT_ADDRESS = '0x93fec6639717b6215a48e5a72a162c50dcc40d68';

// Vault addresses eligible for Spectra boost
export const SPECTRA_BOOST_VAULT_ADDRESSES = [
	'0x80c34BD3A3569E126e7055831036aa7b212cB159',
	'0xE007CA01894c863d7898045ed5A3B4Abf0b18f37',
	'0x9A6bd7B6Fd5C4F87eb66356441502fc7dCdd185B',
	'0x93Fec6639717b6215A48E5a72a162C50DCC40d68'
].map(addr => addr.toLowerCase());
