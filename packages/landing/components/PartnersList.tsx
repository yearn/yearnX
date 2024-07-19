import {Pagination} from '@lib/components/common/Pagination';

import {PARTNERS_PER_PAGE} from '../constants';
import {PartnerCard} from './PartnerCard';

import type {ReactElement} from 'react';
import type {TPartner} from '../types';

export function PartnersList({partners, searchValue}: {partners: TPartner[]; searchValue: string}): ReactElement {
	const getLayout = (): ReactElement => {
		if (partners.length === 0) {
			return (
				<div className={'flex w-full flex-col items-center justify-center'}>
					<div>{'Nothing to display'}</div>
					{Boolean(searchValue) && <div>{`The partner "${searchValue}" does not exist`}</div>}
				</div>
			);
		}

		return (
			<div className={'grid w-full grid-cols-1 gap-2 md:grid-cols-4'}>
				{partners.map(partner => (
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
				currentPage={1}
				amountOfPages={partners.length / PARTNERS_PER_PAGE}
				nextPage={() => {}}
				prevPage={() => {}}
			/>
		</div>
	);
}
