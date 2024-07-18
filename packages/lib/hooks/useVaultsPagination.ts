import {useEffect, useMemo, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';

import type {TYDaemonVaults} from './useYearnVaults.types';

/**************************************************************************************************
 ** Window.location.href is WAY faster to load than the useSearchParams hook and is available from
 ** the start. We can then use this function to get the currentPage from the URL without having a
 ** re-render once the proper state is set after a few ms/seconds.
 *************************************************************************************************/
function getCurrentPageFromUrl(): number {
	if (typeof window !== 'undefined') {
		const url = new URL(window.location.href);
		const page = url.searchParams.get('page');
		return page ? Number(page) : 1;
	}
	return 1;
}

/**************************************************************************************************
 ** Custom hook to manage pagination for a list of vaults. This hook provides the current page,
 ** the vaults for the current page, functions to navigate to the next and previous pages, and the
 ** total number of pages. It also saves the current page number in URL.
 *************************************************************************************************/
export const useVaultsPagination = (
	vaultsPerPage: number,
	vaults: TYDaemonVaults
): {currentPage: number; vaults: TYDaemonVaults; nextPage: () => void; prevPage: () => void; amountOfPages: number} => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [currentPage, set_currentPage] = useState<number>(getCurrentPageFromUrl());

	useEffect(() => {
		const page = Number(searchParams.get('page')) ?? 1;
		if (page < 1 || page > Math.ceil(vaults.length / vaultsPerPage) || isNaN(page)) {
			set_currentPage(1);
		} else {
			set_currentPage(page);
		}
	}, [searchParams, vaults.length, vaultsPerPage]);

	const currentPageVaults = useMemo(() => {
		return vaults.slice((Number(currentPage) - 1) * vaultsPerPage, Number(currentPage) * vaultsPerPage);
	}, [currentPage, vaults, vaultsPerPage]);

	const amountOfPages = useMemo(() => Math.ceil(vaults.length / vaultsPerPage), [vaults.length, vaultsPerPage]);

	const nextPage = (): void => {
		if (Number(currentPage) === amountOfPages) {
			return;
		}
		router.push(`?page=${Number(currentPage) + 1}`);
	};

	const prevPage = (): void => {
		if (Number(currentPage) === 1) {
			return;
		}
		router.push(`?page=${Number(currentPage) - 1}`);
	};

	return {currentPage: Number(currentPage), vaults: currentPageVaults, nextPage, prevPage, amountOfPages};
};
