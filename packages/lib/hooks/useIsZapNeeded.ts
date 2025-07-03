import {isAddress} from '@lib/utils';
import {katana} from '@lib/utils/tools.chains';

import type {TVaultsConfiguration} from '@lib/contexts/useManageVaults';

const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const useIsZapNeeded = (
	configuration: TVaultsConfiguration
): {
	isZapNeededForDeposit: boolean;
	isZapNeededForWithdraw: boolean;
} => {
	// ETH should not trigger zap flow - it's handled separately via wrapping if chain is katana
	const shouldTriggerWrap =
		configuration?.tokenToSpend?.token?.address?.toLowerCase() === ETH_ADDRESS.toLowerCase() &&
		configuration?.tokenToSpend?.token?.chainID === katana.id;

	// Zap is needed if we are depositing and ...
	const isZapNeededForDeposit =
		// We indeed have a tokenToSpend ...
		isAddress(configuration?.tokenToSpend.token?.address) &&
		// ... and the vault token is also defined ...
		isAddress(configuration.vault?.token.address) &&
		// ... and we are trying to deposit a token that is different from the vault token
		configuration?.tokenToSpend?.token?.address !== configuration?.vault.token?.address &&
		// ... and it's not a wrap on katana
		!shouldTriggerWrap;

	const isZapNeededForWithdraw =
		// We indeed have a tokenToReceive ...
		isAddress(configuration?.tokenToReceive.token?.address) &&
		// ... and the vault token is also defined ...
		isAddress(configuration.vault?.token.address) &&
		// ... and we are trying to withdraw a token that is different from the vault token
		configuration?.tokenToReceive?.token?.address !== configuration?.vault.token?.address;

	return {isZapNeededForDeposit, isZapNeededForWithdraw};
};
