import {Fragment, type ReactElement} from 'react';
import {Dialog, Transition, TransitionChild} from '@headlessui/react';
import {cl} from '@lib/utils';

import {IconSuccess} from '../icons/IconSuccess';
import {Button} from './Button';

type TSuccessModalProps = {
	onClose: VoidFunction;
	isOpen: boolean;
	description: ReactElement | null;
};

export function SuccessModal(props: TSuccessModalProps): ReactElement {
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
					<div className={cl('fixed -translate-y-1/2 top-1/2 p-4 text-center sm:items-center sm:p-0')}>
						<div
							className={
								'bg-background relative flex flex-col items-center justify-center rounded-2xl p-10 md:min-w-[400px]'
							}>
							<IconSuccess />
							<p className={'mt-6 font-bold'}>{'Success'}</p>
							<div className={'mb-10 max-w-xs'}>{props.description}</div>
							<Button
								onClick={props.onClose}
								isBusy={false}
								isDisabled={false}
								className={cl(
									'text-background flex w-full justify-center regularTextspace-nowrap rounded-lg bg-regularText md:px-[34.5px] py-5 font-bold',
									'disabled:bg-regularText/10 disabled:text-regularText/30 disabled:cursor-not-allowed !h-12'
								)}>
								{'Nice'}
							</Button>
						</div>
					</div>
				</TransitionChild>
			</Dialog>
		</Transition>
	);
}
