import ReactPaginate from 'react-paginate';
import {useRouter} from 'next/navigation';

import {IconArrowLeft} from '../icons/IconArrowLeft';

import type {ReactElement} from 'react';

type TPaginationProps = {
	currentPage: number;
	totalVaultLength: number;
	vaultsPerPage: number;
	amountOfPages: number;
	nextPage: () => void;
	prevPage: () => void;
};
export const Pagintaion = (props: TPaginationProps): ReactElement => {
	const {currentPage, totalVaultLength, vaultsPerPage, nextPage, prevPage, amountOfPages} = props;
	const router = useRouter();
	const getFrom = (): number => {
		return currentPage === 1 ? 1 : (currentPage - 1) * vaultsPerPage + 1;
	};

	const getTo = (): number => {
		return currentPage === amountOfPages ? totalVaultLength : currentPage * vaultsPerPage;
	};

	const onPageClick = (num: number): void => {
		router.push(`?page=${num}`);
	};

	return (
		<div className={'flex w-full  pt-6'}>
			<div className={'flex-start whitespace-nowrap md:absolute '}>
				{'Showing '}
				{getFrom()}
				{' to '}
				{getTo()}
				{' of '}
				{totalVaultLength}
				{' results'}
			</div>
			<div className={'flex w-full items-center justify-center'}>
				<ReactPaginate
					className={'flex items-center gap-x-4'}
					pageCount={amountOfPages}
					previousLabel={
						<button onClick={prevPage}>
							<IconArrowLeft className={'size-5'} />
						</button>
					}
					nextLabel={
						<button onClick={nextPage}>
							<IconArrowLeft className={'size-5 rotate-180 text-white'} />
						</button>
					}
					onPageChange={({selected}) => onPageClick(selected + 1)}
					pageRangeDisplayed={1}
					marginPagesDisplayed={5}
					pageClassName={'text-gray-100'}
					activeClassName={'text-white'}
					breakClassName={'text-gray-100'}
					nextClassName={'mt-2'}
					previousClassName={'mt-2'}
				/>
			</div>
		</div>
	);
};
