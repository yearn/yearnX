import {type ReactElement, type ReactNode} from 'react';

import {Hero} from './Hero';

import type {NextComponentType} from 'next';
import type {AppProps} from 'next/app';
import type {NextRouter} from 'next/router';

type TAppProps = {
	children: ReactNode;
};

function App(props: TAppProps): ReactElement {
	return <section className={'mt-16 flex w-full justify-center px-2'}>{props.children}</section>;
}

type TComponent = NextComponentType & {
	getLayout: (p: ReactElement, router: NextRouter) => ReactElement;
};

export default function Layout(props: AppProps): ReactElement {
	const {Component, router} = props;
	const getLayout = (Component as TComponent).getLayout || ((page: ReactElement): ReactElement => page);

	return (
		<div className={' flex w-full flex-col justify-center md:px-0'}>
			{/* {isNavBarOpen && <MobileNavBar set_isNavBarOpen={set_isNavBarOpen} />} */}
			<Hero />
			<App>{getLayout(<Component {...props} />, router)}</App>
		</div>
	);
}
