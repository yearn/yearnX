import {Pagination} from '@lib/components/common/Pagination';
import {usePartnersPagination} from '@lib/hooks/usePartnersPagintaion';

import {PARTNERS_PER_PAGE} from '../constants';
import {PartnerCard} from './PartnerCard';

import type {ReactElement} from 'react';
import type {TPartners} from '../types';

export function PartnersList({partners, searchValue}: {partners: TPartners; searchValue: string}): ReactElement {
	const page = usePartnersPagination(PARTNERS_PER_PAGE, partners);

	/**********************************************************************************************
	 ** getLayout fucntion returns jsx according or Parters array. If there are no partners,
	 ** it returns "Nothing to display" label. If there are no partners that user searches,
	 ** it returns "Nothing to display, The partner 'search value' does not exist" label
	 *********************************************************************************************/
	const getLayout = (): ReactElement => {
		if (page.partners.length === 0) {
			return (
				<div className={'flex w-full flex-col items-center justify-center'}>
					<div className={'text-regularText mb-1 text-lg font-bold'}>{'Nothing to display'}</div>
					{Boolean(searchValue) && (
						<div className={'text-regularText/50 text-sm font-normal leading-[16px]'}>
							{`The partner "${searchValue}" does not exist`}
						</div>
					)}
				</div>
			);
		}

		return (
			<div className={'grid size-full grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4'}>
				{page.partners.map(partner => (
					<PartnerCard
						key={partner.name}
						partner={partner}
					/>
				))}
			</div>
		);
	};
	return (
		<div
			id={'partners'}
			className={'flex w-full flex-col'}>
			<div className={'w-full'}>{getLayout()}</div>
			<Pagination
				currentPage={page.currentPage}
				amountOfPages={page.amountOfPages}
				goToNextPage={page.goToNextPage}
				goToPrevPage={page.goToPrevPage}
				goToPage={page.goToPage}
			/>
		</div>
	);
}
