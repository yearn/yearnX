import React from 'react';

import type {ReactElement} from 'react';

function IconCircleQuestion(props: React.SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			{...props}
			width={'16'}
			height={'16'}
			viewBox={'0 0 16 16'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<g clipPath={'url(#clip0_83_7562)'}>
				<path
					d={
						'M8.00033 4.9444C8.33783 4.9444 8.61144 5.21801 8.61144 5.55551V5.56163C8.61144 5.89913 8.33783 6.17274 8.00033 6.17274C7.66282 6.17274 7.38921 5.89913 7.38921 5.56163V5.55551C7.38921 5.21801 7.66282 4.9444 8.00033 4.9444Z'
					}
					fill={'currentColor'}
					fillOpacity={'0.5'}
				/>
				<path
					d={
						'M8.00033 6.77774C8.33783 6.77774 8.61144 7.05134 8.61144 7.38885V11.0555C8.61144 11.393 8.33783 11.6666 8.00033 11.6666C7.66282 11.6666 7.38921 11.393 7.38921 11.0555V7.38885C7.38921 7.05134 7.66282 6.77774 8.00033 6.77774Z'
					}
					fill={'currentColor'}
					fillOpacity={'0.5'}
				/>
				<path
					fillRule={'evenodd'}
					clipRule={'evenodd'}
					d={
						'M13.1858 2.81453C10.3219 -0.0493409 5.67876 -0.0493409 2.81489 2.81453C-0.0489747 5.67839 -0.0489747 10.3215 2.81489 13.1854C5.67876 16.0493 10.3219 16.0493 13.1858 13.1854C16.0496 10.3215 16.0496 5.67839 13.1858 2.81453ZM3.67913 3.67877C6.06569 1.29221 9.93496 1.29221 12.3215 3.67877C14.7081 6.06533 14.7081 9.93459 12.3215 12.3211C9.93496 14.7077 6.06569 14.7077 3.67913 12.3211C1.29257 9.93459 1.29257 6.06533 3.67913 3.67877Z'
					}
					fill={'currentColor'}
					fillOpacity={'0.5'}
				/>
			</g>
			<defs>
				<clipPath id={'clip0_83_7562'}>
					<rect
						width={'16'}
						height={'16'}
						fill={'white'}
					/>
				</clipPath>
			</defs>
		</svg>
	);
}

export {IconCircleQuestion};
