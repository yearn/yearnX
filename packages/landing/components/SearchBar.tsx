import {IconCross} from '@lib/components/icons/IconCross';
import {IconSearch} from '@lib/components/icons/IconSearch';
import {cl} from '@lib/utils';

import type {ReactElement} from 'react';

type TSearchBarProps = {
	searchValue: string;
	set_searchValue: (value: string) => void;
};

export function SearchBar(props: TSearchBarProps): ReactElement {
	return (
		<div>
			<label
				className={cl(
					'z-20 !h-12 relative transition-all border border-regularText',
					'flex flex-row items-center cursor-text',
					'focus:placeholder:text-regularText/40 placeholder:transition-colors',
					'py-2 pl-0 pr-4 group bg-regularText/5 rounded-[80px]'
				)}>
				<input
					className={cl(
						'w-full relative rounded-lg py-3 px-4 bg-transparent border-none text-base',
						'text-regularText placeholder:text-regularText/40 caret-regularText/60',
						'focus:placeholder:text-regularText/40 placeholder:transition-colors',
						'disabled:cursor-not-allowed disabled:opacity-40'
					)}
					type={'text'}
					placeholder={'Search partners'}
					autoComplete={'off'}
					autoCorrect={'off'}
					spellCheck={'false'}
					value={props.searchValue}
					onChange={e => props.set_searchValue(e.target.value)}
				/>

				{props.searchValue ? (
					<button onClick={() => props.set_searchValue('')}>
						<IconCross className={'text-regularText size-5'} />
					</button>
				) : (
					<IconSearch className={'text-regularText size-5'} />
				)}
			</label>
		</div>
	);
}
