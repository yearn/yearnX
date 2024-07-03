import {useEffect, useMemo} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';

import type {TYDaemonVaults} from './useYearnVaults.types';

export const useVaultsPagination = (
	vaultsPerPage: number,
	vaults: TYDaemonVaults
): {currentPage: number; vaults: TYDaemonVaults; nextPage: () => void; prevPage: () => void; amountOfPages: number} => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const currentPage = searchParams.get('page') ?? 1;

	const currentPageVaults = useMemo(() => {
		return vaults.slice((Number(currentPage) - 1) * vaultsPerPage, Number(currentPage) * vaultsPerPage);
	}, [currentPage, vaults, vaultsPerPage]);

	useEffect(() => {
		if (!currentPage) {
			router.push('?page=1');
		}
	});

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
