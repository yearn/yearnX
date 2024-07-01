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
		colors: {
			table: '#441F93',
			background: '#4C249F',
			white: '#FFFFFF'
		},
		fontSize: {
			'7xl': '64px'
		},
		lineHeight: {
			'7xl': '64px'
		},
		padding: {
			'10': '40px'
		}
	},
	safelist: ['text-7xl', 'font-black', 'leading-7xl', 'p-10']
};
