import {useEffect, useMemo, useState} from 'react';

import type {TPartners} from 'packages/landing/types';

export function usePartnersPagination(
	partnersPerPage: number,
	partners: TPartners
): {
	currentPage: number;
	partners: TPartners;
	nextPage: () => void;
	prevPage: () => void;
	goToPage: (page: number) => void;
	amountOfPages: number;
} {
	const [currentPage, set_currentPage] = useState<number>(1);

	useEffect(() => {
		if (currentPage < 1 || currentPage > Math.ceil(partners.length / partnersPerPage) || isNaN(currentPage)) {
			set_currentPage(1);
		}
	}, [currentPage, partners.length, partnersPerPage]);

	const currentPagePartners = useMemo(() => {
		return partners.slice((currentPage - 1) * partnersPerPage, currentPage * partnersPerPage);
	}, [currentPage, partners, partnersPerPage]);

	const amountOfPages = useMemo(
		() => Math.ceil(partners.length / partnersPerPage),
		[partners.length, partnersPerPage]
	);

	const nextPage = (): void => {
		if (currentPage === amountOfPages) {
			return;
		}
		set_currentPage(prev => prev + 1);
	};

	const prevPage = (): void => {
		if (currentPage === 1) {
			return;
		}
		set_currentPage(prev => prev - 1);
	};

	const goToPage = (page: number): void => {
		set_currentPage(page);
	};

	return {currentPage, partners: currentPagePartners, nextPage, prevPage, goToPage, amountOfPages};
}
