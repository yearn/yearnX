import React from 'react';

import type {ReactElement} from 'react';

function IconArrowLeft(props: React.SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			{...props}
			width={'10'}
			height={'8'}
			viewBox={'0 0 10 8'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<path
				d={'M9 3.66667L1 3.66667M1 3.66667L3.66667 1M1 3.66667L3.66667 6.33333'}
				stroke={'currentColor'}
				strokeOpacity={'0.3'}
				strokeWidth={'1.5'}
				strokeLinecap={'round'}
				strokeLinejoin={'round'}
			/>
		</svg>
	);
}

export {IconArrowLeft};
