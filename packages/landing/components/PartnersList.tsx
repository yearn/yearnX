import {Pagination} from '@lib/components/common/Pagination';
import {usePartnersPagination} from '@lib/hooks/usePartnersPagintaion';

import {PartnerCard} from './PartnerCard';

import type {ReactElement} from 'react';
import type {TPartners} from '../types';

export function PartnersList({partners, searchValue}: {partners: TPartners; searchValue: string}): ReactElement {
	const {
		currentPage,
		partners: paginatedPartners,
		nextPage,
		prevPage,
		goToPage,
		amountOfPages
	} = usePartnersPagination(4, partners);

	const getLayout = (): ReactElement => {
		if (paginatedPartners.length === 0) {
			return (
				<div className={'flex w-full flex-col items-center justify-center'}>
					<div>{'Nothing to display'}</div>
					{Boolean(searchValue) && <div>{`The partner "${searchValue}" does not exist`}</div>}
				</div>
			);
		}

		return (
			<div className={'grid w-full grid-cols-1 gap-2 md:grid-cols-4'}>
				{paginatedPartners.map(partner => (
					<PartnerCard
						key={partner.name}
						partner={partner}
					/>
				))}
			</div>
		);
	};
	return (
		<div className={'flex w-full flex-col'}>
			<div className={'w-full'}>{getLayout()}</div>
			<Pagination
				currentPage={currentPage}
				amountOfPages={amountOfPages}
				nextPage={nextPage}
				prevPage={prevPage}
				handlePageClick={(page: number) => goToPage(page)}
			/>
		</div>
	);
}
