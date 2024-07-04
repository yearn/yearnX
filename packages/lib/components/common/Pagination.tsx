import {type ReactElement, useCallback} from 'react';
import ReactPaginate from 'react-paginate';
import {useRouter} from 'next/router';
import {cl} from '@builtbymom/web3/utils';

import {IconArrowLeft} from '../icons/IconArrowLeft';

import type {ParsedUrlQueryInput} from 'querystring';

type TPaginationProps = {
	currentPage: number;
	amountOfPages: number;
	nextPage: () => void;
	prevPage: () => void;
};
export const Pagination = (props: TPaginationProps): ReactElement => {
	const {currentPage, nextPage, prevPage, amountOfPages} = props;
	const router = useRouter();

	/**********************************************************************************************
	 ** When the user clicks on a page number, the page number is updated in the URL query string.
	 ** If the page number is 1, the page number is removed from the URL query string.
	 *********************************************************************************************/
	const onPageClick = useCallback(
		(num: number): void => {
			const currentRouterArguments = router.query;
			let query: ParsedUrlQueryInput = {...currentRouterArguments};
			if (num === 1) {
				delete currentRouterArguments.page;
				query = {...currentRouterArguments};
			} else {
				query = {...currentRouterArguments, page: num};
			}
			router.push({pathname: router.pathname, query}, undefined, {shallow: true, scroll: true});
		},
		[router]
	);

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
								'mb-2 rounded-lg p-2 md:p-3 outline-1 outline-white/15',
								'hover:bg-white/5 hover:outline',
								currentPage === 1 ? 'text-white/15' : 'text-white'
							)}>
							<IconArrowLeft className={'size-5'} />
						</button>
					}
					nextLabel={
						<button
							onClick={nextPage}
							disabled={currentPage === amountOfPages}
							className={cl(
								'mb-2 rounded-lg p-2 md:p-3 outline-1 outline-white/15',
								'hover:outline hover:bg-white/5',
								currentPage === amountOfPages ? 'text-white/15' : 'text-white'
							)}>
							<IconArrowLeft className={'size-5 rotate-180'} />
						</button>
					}
					onPageChange={({selected}) => onPageClick(selected + 1)}
					pageLabelBuilder={page => (
						<button
							className={cl(
								'rounded-lg px-3 md:px-4 py-1 md:py-2 outline-1 outline-white/15',
								'hover:text-white hover:outline hover:bg-white/5'
							)}>
							{page}
						</button>
					)}
					activeClassName={'!text-white'}
					pageClassName={'text-white/15'}
					breakClassName={'text-white/15'}
					nextClassName={'mt-2'}
					previousClassName={'mt-2'}
					forcePage={currentPage - 1 > 0 ? currentPage - 1 : 0}
				/>
			</div>
		</div>
	);
};
