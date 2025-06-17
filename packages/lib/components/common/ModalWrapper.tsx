import {Fragment} from 'react';
import {Dialog, Transition, TransitionChild} from '@headlessui/react';
import {cl} from '@lib/utils';

import type {ReactElement} from 'react';

type TModalWrapper = {
	isOpen: boolean;
	onClose: () => void;
	children: ReactElement;
};

export function ModalWrapper(props: TModalWrapper): ReactElement {
	return (
		<Transition
			show={props.isOpen}
			as={Fragment}>
			<Dialog
				as={'div'}
				className={'relative z-[1000] flex h-screen w-screen items-center justify-center'}
				onClose={props.onClose}>
				<TransitionChild
					as={Fragment}
					enter={'ease-out duration-200'}
					enterFrom={'opacity-0'}
					enterTo={'opacity-100'}
					leave={'ease-in duration-200'}
					leaveFrom={'opacity-100'}
					leaveTo={'opacity-0'}>
					<div
						onClick={() => props.onClose()}
						className={'fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity'}
					/>
				</TransitionChild>

				<TransitionChild
					as={Fragment}
					enter={'ease-out duration-300'}
					enterFrom={'opacity-0'}
					enterTo={'opacity-100'}
					leave={'ease-in duration-200'}
					leaveFrom={'opacity-100'}
					leaveTo={'opacity-0'}>
					<div className={cl('fixed -translate-y-1/3 top-1/3 p-4 text-center sm:items-center sm:p-0')}>
						{props.children}
					</div>
				</TransitionChild>
			</Dialog>
		</Transition>
	);
}
