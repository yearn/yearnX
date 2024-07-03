/** @type {import('tailwindcss').Config} */
const config = require('../lib/tailwind.config');

module.exports = {
	...config,
	content: [
		...config.content,
		'./components/**/*.{js,ts,jsx,tsx}',
		'./contexts/**/*.{js,ts,jsx,tsx}',
		'./hooks/**/*.{js,ts,jsx,tsx}',
		'./pages/**/*.{js,ts,jsx,tsx}'
	],
	plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography'), require('tailwindcss-animate')],
	theme: {
		...config.theme,
		extend: {
			...config.theme.extend,
			colors: {
				...config.theme.extend.colors,
				white: '#FFFFFF',
				button: '#1BE3C2',
				buttonHover: '#1EFCD8',
				accentText: '#0C0C0C',
				background: '#090D18',
				table: '#151E2F',
				primary: '#1BE3C2',
				secondary: '#6079FF',
				border: '#7054ac',
				gray: {
					0: '#28303f',
					100: '#504c5c',
					200: '#54349c'
				}
			},
			minHeight: {
				section: '528px'
			},
			height: {
				section: '528px'
			}
		}
	}
};
