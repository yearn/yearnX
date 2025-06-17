import {type ReactElement} from 'react';
import ReactPaginate from 'react-paginate';
import {cl} from '@lib/utils';

import {IconArrowLeft} from '../icons/IconArrowLeft';

type TPaginationProps = {
	currentPage: number;
	amountOfPages: number;
	goToNextPage: () => void;
	goToPrevPage: () => void;
	goToPage: (pageNumber: number) => void;
};
export const Pagination = (props: TPaginationProps): ReactElement => {
	const {currentPage, goToNextPage, goToPrevPage, goToPage, amountOfPages} = props;

	return (
		<>
			{amountOfPages ? (
				<div className={'flex w-full pt-6'}>
					<div className={'flex w-full items-center justify-center'}>
						<ReactPaginate
							className={'flex items-center'}
							pageCount={amountOfPages}
							breakLabel={<span className={'p-3'}>{'...'}</span>}
							pageRangeDisplayed={2}
							previousLabel={
								<button
									onClick={goToPrevPage}
									disabled={currentPage === 1}
									className={cl(
										'mb-2 rounded-lg p-2 md:p-3 outline-1 outline-regularText/15',
										'hover:bg-regularText/5 hover:outline',
										currentPage === 1 ? 'text-regularText/15' : 'text-regularText'
									)}>
									<IconArrowLeft className={'size-5'} />
								</button>
							}
							nextLabel={
								<button
									onClick={goToNextPage}
									disabled={currentPage === amountOfPages}
									className={cl(
										'mb-2 rounded-lg p-2 md:p-3 outline-1 outline-regularText/15',
										'hover:outline hover:bg-regularText/5',
										currentPage === amountOfPages ? 'text-regularText/15' : 'text-regularText'
									)}>
									<IconArrowLeft className={'size-5 rotate-180'} />
								</button>
							}
							onPageChange={({selected}) => goToPage(selected + 1)}
							pageLabelBuilder={page => (
								<button
									className={cl(
										'rounded-lg px-3 md:px-4 py-1 md:py-2 outline-1 outline-regularText/15',
										'hover:text-regularText hover:outline hover:bg-regularText/5'
									)}>
									{page}
								</button>
							)}
							activeClassName={'!text-regularText'}
							pageClassName={'text-regularText/15'}
							breakClassName={'text-regularText/15'}
							nextClassName={'mt-2'}
							previousClassName={'mt-2'}
							forcePage={currentPage - 1 > 0 ? currentPage - 1 : 0}
						/>
					</div>
				</div>
			) : null}
		</>
	);
};
