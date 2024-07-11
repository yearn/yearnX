import {useEffect, useState} from 'react';

export const useDebounce = <T>(value: T, delay: number): {debouncedValue: T; isLoading: boolean} => {
	const [debouncedValue, set_debouncedValue] = useState<T>(value);
	const [isLoading, set_isLoading] = useState(false);
	useEffect(() => {
		set_isLoading(true);
		const handler = setTimeout(() => {
			set_debouncedValue(value);
			set_isLoading(false);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);
	return {debouncedValue, isLoading};
};
