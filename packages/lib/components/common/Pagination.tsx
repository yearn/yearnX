import ReactPaginate from 'react-paginate';
import {useRouter} from 'next/navigation';
import {cl} from '@builtbymom/web3/utils';

import {IconArrowLeft} from '../icons/IconArrowLeft';

import type {ReactElement} from 'react';

type TPaginationProps = {
	currentPage: number;
	amountOfPages: number;
	nextPage: () => void;
	prevPage: () => void;
};
export const Pagintaion = (props: TPaginationProps): ReactElement => {
	const {currentPage, nextPage, prevPage, amountOfPages} = props;
	const router = useRouter();

	const onPageClick = (num: number): void => {
		router.push(`?page=${num}`);
	};

	return (
		<div className={'flex w-full pt-6'}>
			<div className={'flex w-full items-center justify-center'}>
				<ReactPaginate
					className={'flex items-center'}
					pageCount={amountOfPages}
					breakLabel={<span className={'p-3'}>{'...'}</span>}
					pageRangeDisplayed={2}
					previousLabel={
						<button
							onClick={prevPage}
							disabled={currentPage === 1}
							className={cl(
								'mb-2 rounded-lg p-2 md:p-3 outline-1 outline-gray-100',
								'hover:bg-gray-0 hover:outline',
								currentPage === 1 ? 'text-gray-100' : 'text-white'
							)}>
							<IconArrowLeft className={'size-5'} />
						</button>
					}
					nextLabel={
						<button
							onClick={nextPage}
							disabled={currentPage === amountOfPages}
							className={cl(
								'mb-2 rounded-lg p-2 md:p-3 outline-1 outline-gray-100',
								'hover:outline hover:bg-gray-0',
								currentPage === amountOfPages ? 'text-gray-100' : 'text-white'
							)}>
							<IconArrowLeft className={'size-5 rotate-180'} />
						</button>
					}
					onPageChange={({selected}) => onPageClick(selected + 1)}
					pageLabelBuilder={page => (
						<button
							className={cl(
								'rounded-lg px-3 md:px-4 py-1 md:py-2 outline-1 outline-gray-100',
								'hover:text-white hover:outline hover:bg-gray-0'
							)}>
							{page}
						</button>
					)}
					activeClassName={'text-white'}
					pageClassName={'text-gray-100'}
					breakClassName={'text-gray-100'}
					nextClassName={'mt-2'}
					previousClassName={'mt-2'}
				/>
			</div>
		</div>
	);
};
