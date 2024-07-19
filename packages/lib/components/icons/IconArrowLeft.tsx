import React from 'react';

import type {ReactElement} from 'react';

function IconArrowLeft(props: React.SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			{...props}
			width={'16'}
			height={'16'}
			viewBox={'0 0 16 16'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<path
				d={'M12 7.66667L4 7.66667M4 7.66667L6.66667 5M4 7.66667L6.66667 10.3333'}
				stroke={'currentcolor'}
				strokeOpacity={'1'}
				strokeWidth={'1.5'}
				strokeLinecap={'round'}
				strokeLinejoin={'round'}
			/>
		</svg>
	);
}

export {IconArrowLeft};
