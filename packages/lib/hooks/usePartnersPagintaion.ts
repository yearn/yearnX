'use client';

import {useMemo} from 'react';
import {parseAsInteger, useQueryState} from 'nuqs';

import type {TPartners} from 'packages/landing/types';

type TUsePartnerPagination = {
	currentPage: number;
	partners: TPartners;
	goToNextPage: () => void;
	goToPrevPage: () => void;
	goToPage: (pageNumber: number) => void;
	amountOfPages: number;
};

/**************************************************************************************************
 ** Custom hook to manage pagination for a list of partners. This hook provides the current page,
 ** the partners for the current page, functions to navigate to the next and previous pages, and
 ** the total number of pages. It also saves the current page number in URL.
 **
 ** @params partnersPerPage: number - The number of partners per page we want to display.
 ** @params partners: TPartners - The list of partners to paginate.
 **
 ** @returns currentPage: number - The current page number.
 ** @returns partners: TPartners - The partners for the current page.
 ** @returns goToNextPage: () => void - Function to navigate to the next page.
 ** @returns goToPrevPage: () => void - Function to navigate to the previous page.
 ** @returns goToPage: (pageNumber: number) => void - Function to navigate to a specific page.
 ** @returns amountOfPages: number - The total number of pages.
 *************************************************************************************************/
export function usePartnersPagination(partnersPerPage: number, partners: TPartners): TUsePartnerPagination {
	const [currentPage, set_currentPage] = useQueryState('page', parseAsInteger.withDefault(1));

	/**********************************************************************************************
	 ** amountOfPages is a memoized number of pages based on the total number of partners and the
	 ** number of partners per page.
	 **
	 ** @params void
	 ** @returns number - The total number of pages.
	 *********************************************************************************************/
	const amountOfPages = useMemo(
		() => Math.ceil(partners.length / partnersPerPage),
		[partners.length, partnersPerPage]
	);

	/**********************************************************************************************
	 ** currentPagePartners is a memoized array of partners for the current page. It calculates the
	 ** current page index and slices the partners array to return the partners for the current page.
	 **
	 ** @params void
	 ** @returns TPartners - The partners for the current page.
	 *********************************************************************************************/
	const currentPagePartners = useMemo(() => {
		return partners.slice((currentPage - 1) * partnersPerPage, currentPage * partnersPerPage);
	}, [currentPage, partners, partnersPerPage]);

	/**********************************************************************************************
	 ** goToNextPage is a shortcut to navigate to the next page. It will not navigate if the current
	 ** page is the last page.
	 **
	 ** @params void
	 ** @returns void
	 *********************************************************************************************/
	const goToNextPage = (): void => {
		if (Number(currentPage) === amountOfPages) {
			return;
		}
		set_currentPage(Number(currentPage) + 1);
	};

	/**********************************************************************************************
	 ** goToPrevPage is a shortcut to navigate to the previous page. It will not navigate if the
	 ** current page is the first page.
	 **
	 ** @params void
	 ** @returns void
	 *********************************************************************************************/
	const goToPrevPage = (): void => {
		if (Number(currentPage) === 1) {
			set_currentPage(null);
			return;
		}
		set_currentPage(Number(currentPage) - 1);
	};

	/**********************************************************************************************
	 ** goToPage will navigate to the specified page number. It will not navigate if the provided
	 ** page number is less than 1 or greater than the total amount of pages.
	 **
	 ** @params pageNumber: number - The page number to navigate to.
	 ** @returns void
	 *********************************************************************************************/
	const goToPage = (pageNumber: number): void => {
		if (pageNumber <= 1) {
			set_currentPage(null);
			return;
		}
		if (pageNumber > amountOfPages) {
			return;
		}
		set_currentPage(pageNumber);
	};

	return {currentPage, partners: currentPagePartners, goToNextPage, goToPrevPage, goToPage, amountOfPages};
}
