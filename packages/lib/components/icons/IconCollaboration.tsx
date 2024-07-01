import React from 'react';

import type {ReactElement} from 'react';

function IconColloboration(props: React.SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			{...props}
			width={'16'}
			height={'16'}
			viewBox={'0 0 16 16'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<path
				d={'M2.94971 2.94971L12.8492 12.8492'}
				stroke={'white'}
				strokeWidth={'2'}
				strokeLinecap={'round'}
			/>
			<path
				d={'M12.8491 2.94971L2.94963 12.8492'}
				stroke={'white'}
				strokeWidth={'2'}
				strokeLinecap={'round'}
			/>
		</svg>
	);
}

export {IconColloboration};
