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
				table: '#441F93',
				background: '#4C249F',
				white: '#FFFFFF',
				primary: '#6303FF'
			},
			height: {
				section: '528px'
			}
		}
	},
	safelist: [
		'text-7xl',
		'flex-col-reverse',
		'md:flex-row',
		'sm:',
		'lg:',
		'h-section',
		'font-black',
		'leading-7xl',
		'bg-primary',
		'p-10',
		'rounded-t-2xl',
		'rounded-b-2xl',
		'md:rounded-2xl',
		'leading-3xl',
		'md:leading-7xl',
		'md:text-7xl',
		'md:grid-cols-3',
		'md:gap-x-6',
		'md:w-inherit',
		'size-full',
		'mb-6',
		'h-80',
		'md:h-section',
		'text-3xl',
		'md:w-1/3',
		'w-2/3',
		'mt-5',
		'md:mb-2'
	]
};
