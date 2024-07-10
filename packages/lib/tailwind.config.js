/* eslint-disable @typescript-eslint/explicit-function-return-type */
const plugin = require('tailwindcss/plugin');
const defaultTheme = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors');

function withOpacityValue(variable) {
	return ({opacityValue}) => {
		if (opacityValue === undefined) {
			return `hsl(var(${variable}))`;
		}
		return `hsl(var(${variable}) / ${opacityValue})`;
	};
}

module.exports = {
	content: [
		'../lib/components/**/*.{js,jsx,ts,tsx}',
		'../lib/hooks/**/*.{js,jsx,ts,tsx}',
		'../lib/icons/**/*.{js,jsx,ts,tsx}',
		'../lib/common/**/*.{js,jsx,ts,tsx}',
		'../lib/contexts/**/*.{js,jsx,ts,tsx}',
		'../lib/primitives/**/*.{js,jsx,ts,tsx}',
		'../lib/types/**/*.{js,jsx,ts,tsx}',
		'../lib/utils/**/*.{js,jsx,ts,tsx}',
		'../lib/sections/**/*.{js,jsx,ts,tsx}'
	],
	theme: {
		colors: {
			black: 'hsl(0, 0%, 0%)',
			white: 'rgb(255, 255, 255)',
			transparent: 'transparent',
			inherit: 'inherit',
			purple: '#4C249F',
			neutral: {
				0: withOpacityValue('--color-neutral-0'),
				50: withOpacityValue('--color-neutral-50'),
				100: withOpacityValue('--color-neutral-100'),
				200: withOpacityValue('--color-neutral-200'),
				300: withOpacityValue('--color-neutral-300'),
				400: withOpacityValue('--color-neutral-400'),
				500: withOpacityValue('--color-neutral-500'),
				600: withOpacityValue('--color-neutral-600'),
				700: withOpacityValue('--color-neutral-700'),
				800: withOpacityValue('--color-neutral-800'),
				900: withOpacityValue('--color-neutral-900')
			}
		},
		extend: {
			fontFamily: {
				aeonik: ['var(--aeonik-font)', 'Aeonik', ...defaultTheme.fontFamily.sans],
				sans: ['var(--aeonik-font)', 'Aeonik', ...defaultTheme.fontFamily.sans],
				mono: ['var(--font-aeonik-mono)', 'Aeonik Mono', ...defaultTheme.fontFamily.mono]
			},
			width: {
				inherit: 'inherit'
			},
			fontSize: {
				xxs: ['10px', '16px'],
				xs: ['12px', '16px'],
				sm: ['14px', '20px'],
				base: ['16px', '24px'],
				intermediate: ['18px', '24px'],
				lg: ['20px', '32px'],
				xl: ['24px', '32px'],
				'3xl': ['32px', '40px'],
				'4xl': ['40px', '56px'],
				'7xl': ['64px', '72px'],
				'9xl': '128px'
			},
			opacity: {
				3: '.03'
			},
			maxWidth: {
				xl: '552px',
				'4xl': '904px',
				'6xl': '1200px'
			},
			minHeight: {
				section: '528px'
			},
			height: {
				section: '528px'
			},
			animation: {
				fadeIn: 'fadeIn 200ms ease-in'
			},
			keyframes: {
				fadeIn: {
					'0%': {opacity: 0},
					'100%': {opacity: 100}
				}
			}
		}
	},
	plugins: [
		require('@tailwindcss/forms'),
		require('@tailwindcss/typography'),
		plugin(function ({addUtilities}) {
			addUtilities({
				'.scrollbar-none': {
					'-ms-overflow-style': 'none',
					'scrollbar-width': 'none',
					'&::-webkit-scrollbar': {
						display: 'none'
					}
				}
			});
		})
	]
};
