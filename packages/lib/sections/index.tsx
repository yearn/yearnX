import {Section1} from './Section1';
import {Section2} from './Section2';
import {Section3} from './Section3';
import {Section4} from './Section4';
import {Section5} from './Section5';

import type {ReactElement} from 'react';

type TSectionProps = {
	variant: 1 | 2 | 3 | 4 | 5;
	title: string;
	description: string;
	bgImage?: string;
	cards?: {
		title: string;
		currency?: string;
		value: number;
		decimals: number;
		isReady: boolean;
	}[];
};
export function Section({variant, title, description, bgImage, cards}: TSectionProps): ReactElement {
	switch (variant) {
		case 1:
			return (
				<Section1
					title={title}
					description={description}
					bgImage={bgImage}
				/>
			);
		case 2:
			return (
				<Section2
					title={title}
					description={description}
					bgImage={bgImage}
					cards={cards}
				/>
			);
		case 3:
			return (
				<Section3
					title={title}
					description={description}
					bgImage={bgImage}
					cards={cards}
				/>
			);
		case 4:
			return (
				<Section4
					title={title}
					description={description}
					bgImage={bgImage}
					cards={cards}
				/>
			);
		case 5:
			return (
				<Section5
					title={title}
					description={description}
					bgImage={bgImage}
				/>
			);
	}
}
