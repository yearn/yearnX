import {isAddress} from '@lib/utils';

import type {TVaultsConfiguration} from '@lib/contexts/useManageVaults';

export const useIsZapNeeded = (
	configuration: TVaultsConfiguration
): {
	isZapNeededForDeposit: boolean;
	isZapNeededForWithdraw: boolean;
} => {
	// Zap is needed if we are depositing and ...
	const isZapNeededForDeposit =
		// We indeed have a tokenToSpend ...
		isAddress(configuration?.tokenToSpend.token?.address) &&
		// ... and the vault token is also defined ...
		isAddress(configuration.vault?.token.address) &&
		// ... and we are trying to deposit a token that is different from the vault token
		configuration?.tokenToSpend?.token?.address !== configuration?.vault.token?.address;

	const isZapNeededForWithdraw =
		// We indeed have a tokenToReceive ...
		isAddress(configuration?.tokenToReceive.token?.address) &&
		// ... and the vault token is also defined ...
		isAddress(configuration.vault?.token.address) &&
		// ... and we are trying to withdraw a token that is different from the vault token
		configuration?.tokenToReceive?.token?.address !== configuration?.vault.token?.address;

	return {isZapNeededForDeposit, isZapNeededForWithdraw};
};
