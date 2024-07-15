import React from 'react';

import type {ReactElement} from 'react';

function IconSuccess(props: React.SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			{...props}
			width={'64'}
			height={'64'}
			viewBox={'0 0 64 64'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<rect
				width={'64'}
				height={'64'}
				rx={'32'}
				fill={'white'}
			/>
			<path
				d={'M17 33L27.6667 43.3783L49 22.6216'}
				stroke={'#0C0C0C'}
				strokeWidth={'5.18919'}
				strokeLinecap={'round'}
				strokeLinejoin={'round'}
			/>
		</svg>
	);
}

export {IconSuccess};
