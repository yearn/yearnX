import {cl} from '@lib/utils';

import {IconSearch} from '../icons/IconSearch';

import type {ReactElement} from 'react';

type TVaultSearchProps = {
	searchValue: string;
	set_searchValue: (value: string) => void;
};

export const VaultSearch = ({searchValue, set_searchValue}: TVaultSearchProps): ReactElement => (
	<div className={'mb-10 flex items-center justify-between'}>
		<span className={'text-regularText pl-2 text-2xl font-bold'}>{'Vaults'}</span>

		<label
			className={cl(
				'z-20 !h-16 relative transition-all border border-regularText/15',
				'flex flex-row items-center cursor-text',
				'focus:placeholder:text-regularText/40 placeholder:transition-colors',
				'py-1 pl-0 pr-4 w-1/3 group border-regularText/15 bg-regularText/5 rounded-lg'
			)}>
			<input
				className={cl(
					'w-full relative rounded-lg py-3 px-4 bg-transparent border-none text-base',
					'text-regularText placeholder:text-regularText/40 caret-regularText/60',
					'focus:placeholder:text-regularText/40 placeholder:transition-colors',
					'disabled:cursor-not-allowed disabled:opacity-40'
				)}
				type={'text'}
				placeholder={'Search vault'}
				autoComplete={'off'}
				autoCorrect={'off'}
				spellCheck={'false'}
				value={searchValue}
				onChange={e => set_searchValue(e.target.value)}
			/>

			<IconSearch className={'text-regularText size-5'} />
		</label>
	</div>
);
