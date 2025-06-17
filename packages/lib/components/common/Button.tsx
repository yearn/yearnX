import React, {forwardRef} from 'react';
import {IconSpinner} from '@icons/IconSpinner';
import {cl} from '@lib/utils';

import type {ComponentPropsWithoutRef, ForwardedRef, MouseEvent, ReactElement, ReactNode} from 'react';

export type TButtonVariant = 'filled' | 'outlined' | 'light' | 'inherit' | string;

export type TButton = {
	children: ReactNode;
	variant?: TButtonVariant;
	shouldStopPropagation?: boolean;
	isBusy?: boolean;
	isDisabled?: boolean;
	spinnerClassName?: string;
} & ComponentPropsWithoutRef<'button'>;

export type TMouseEvent = MouseEvent<HTMLButtonElement> & MouseEvent<HTMLAnchorElement>;

export const Button = forwardRef((props: TButton, ref: ForwardedRef<HTMLButtonElement | null>): ReactElement => {
	const {
		children,
		variant = 'filled',
		shouldStopPropagation = false,
		spinnerClassName,
		isBusy = false,
		isDisabled = false,
		...rest
	} = props;

	return (
		<button
			{...(rest as ComponentPropsWithoutRef<'button'>)}
			ref={ref}
			data-variant={variant}
			className={cl('button relative', rest.className)}
			aria-busy={isBusy}
			disabled={isDisabled || (rest as ComponentPropsWithoutRef<'button'>).disabled}
			onClick={(event: TMouseEvent): void => {
				if (shouldStopPropagation) {
					event.stopPropagation();
				}
				if (!isBusy && rest.onClick) {
					rest.onClick(event);
				}
			}}>
			{children}
			{isBusy ? (
				<div className={'absolute inset-0 flex items-center justify-center'}>
					<IconSpinner className={spinnerClassName ?? 'text-accentText size-6 animate-spin'} />
				</div>
			) : null}
		</button>
	);
});

Button.displayName = 'Button';
