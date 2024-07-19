import {useEffect, useState} from 'react';

/**************************************************************************************************
 ** Custom hook to debounce a value. This hook returns a debounced value and a loading state.
 ** The debounced value will be updated after a specified delay when the input value changes.
 *************************************************************************************************/
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
