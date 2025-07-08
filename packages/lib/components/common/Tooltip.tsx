import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';

import type {FC, ReactNode} from 'react';

type TTooltipProps = {
	children: ReactNode;
	content: string;
	position?: 'top' | 'bottom' | 'left' | 'right';
};

export const Tooltip: FC<TTooltipProps> = ({children, content, position = 'top'}) => {
	const [isVisible, set_isVisible] = useState(false);
	const [coords, set_coords] = useState({top: 0, left: 0});
	const triggerRef = useRef<HTMLDivElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isVisible && triggerRef.current && tooltipRef.current) {
			const triggerRect = triggerRef.current.getBoundingClientRect();
			const tooltipRect = tooltipRef.current.getBoundingClientRect();

			let top = 0;
			let left = 0;

			switch (position) {
				case 'top':
					top = triggerRect.top - tooltipRect.height - 8;
					left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
					break;
				case 'bottom':
					top = triggerRect.bottom + 8;
					left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
					break;
				case 'left':
					top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
					left = triggerRect.left - tooltipRect.width - 8;
					break;
				case 'right':
					top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
					left = triggerRect.right + 8;
					break;
			}

			// Ensure tooltip stays within viewport
			const padding = 8;
			if (left < padding) {
				left = padding;
			}
			if (left + tooltipRect.width > window.innerWidth - padding) {
				left = window.innerWidth - tooltipRect.width - padding;
			}
			if (top < padding) {
				top = padding;
			}
			if (top + tooltipRect.height > window.innerHeight - padding) {
				top = window.innerHeight - tooltipRect.height - padding;
			}

			set_coords({top, left});
		}
	}, [isVisible, position]);

	return (
		<>
			<div
				ref={triggerRef}
				className={'inline-block'}
				onMouseEnter={() => set_isVisible(true)}
				onMouseLeave={() => set_isVisible(false)}>
				{children}
			</div>
			{isVisible &&
				createPortal(
					<div
						ref={tooltipRef}
						className={
							'pointer-events-none fixed z-[9999] whitespace-nowrap rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white shadow-lg'
						}
						style={{top: `${coords.top}px`, left: `${coords.left}px`}}>
						{content}
					</div>,
					document.body
				)}
		</>
	);
};
