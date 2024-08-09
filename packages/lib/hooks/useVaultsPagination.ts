import {useMemo} from 'react';
import {parseAsInteger, useQueryState} from 'nuqs';

import type {TYDaemonVaults} from './useYearnVaults.types';

type TUsePagination = {
	currentPage: number;
	vaults: TYDaemonVaults;
	goToNextPage: () => void;
	goToPrevPage: () => void;
	goToPage: (pageNumber: number) => void;
	amountOfPages: number;
};

/**************************************************************************************************
 ** Custom hook to manage pagination for a list of vaults. This hook provides the current page,
 ** the vaults for the current page, functions to navigate to the next and previous pages, and the
 ** total number of pages. It also saves the current page number in URL.
 **
 ** @params vaultsPerPage: number - The number of vaults per page we want to display.
 ** @params vaults: TYDaemonVaults - The list of vaults to paginate.
 **
 ** @returns currentPage: number - The current page number.
 ** @returns vaults: TYDaemonVaults - The vaults for the current page.
 ** @returns goToNextPage: () => void - Function to navigate to the next page.
 ** @returns goToPrevPage: () => void - Function to navigate to the previous page.
 ** @returns goToPage: (pageNumber: number) => void - Function to navigate to a specific page.
 ** @returns amountOfPages: number - The total number of pages.
 *************************************************************************************************/
export const useVaultsPagination = (vaultsPerPage: number, vaults: TYDaemonVaults): TUsePagination => {
	const [currentPage, set_currentPage] = useQueryState('page', parseAsInteger.withDefault(1));

	/**********************************************************************************************
	 ** amountOfPages is a memoized number of pages based on the total number of vaults and the
	 ** number of vaults per page.
	 **
	 ** @params void
	 ** @returns number - The total number of pages.
	 *********************************************************************************************/
	const amountOfPages = useMemo(() => {
		return Math.ceil(vaults.length / vaultsPerPage);
	}, [vaults.length, vaultsPerPage]);

	/**********************************************************************************************
	 ** currentPageVaults is a memoized array of vaults for the current page. It calculates the
	 ** current page index and slices the vaults array to return the vaults for the current page.
	 **
	 ** @params void
	 ** @returns TYDaemonVaults - The vaults for the current page.
	 *********************************************************************************************/
	const currentPageVaults = useMemo(() => {
		const currentVaultIndex = (Number(currentPage) - 1) * vaultsPerPage;
		return vaults.slice(currentVaultIndex, Number(currentPage) * vaultsPerPage);
	}, [currentPage, vaults, vaultsPerPage]);

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

	return {
		currentPage: Number(currentPage),
		vaults: currentPageVaults,
		goToNextPage,
		goToPrevPage,
		goToPage,
		amountOfPages
	};
};
