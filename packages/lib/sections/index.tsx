import {Section1} from './Section1';
import {Section2} from './Section2';
import {Section3} from './Section3';
import {Section4} from './Section4';
import {Section5} from './Section5';

import type {ReactElement} from 'react';

type TSectionProps = {
	variant: 1 | 2 | 3 | 4 | 5;
};

export function Section({variant}: TSectionProps): ReactElement {
	switch (variant) {
		case 1:
			return <Section1 />;
		case 2:
			return <Section2 />;
		case 3:
			return <Section3 />;
		case 4:
			return <Section4 />;
		case 5:
			return <Section5 />;
	}
}
