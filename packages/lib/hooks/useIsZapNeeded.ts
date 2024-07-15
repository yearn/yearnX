import {isAddress} from '@builtbymom/web3/utils';
import {useManageVaults} from '@lib/contexts/useManageVaults';

export const useIsZapNeeded = (): boolean => {
	const {configuration} = useManageVaults();

	return (
		isAddress(configuration?.tokenToSpend.token?.address) &&
		isAddress(configuration.vault?.token.address) &&
		(configuration?.tokenToSpend?.token?.address !== configuration.vault?.token.address ||
			configuration?.tokenToReceive?.token?.address !== configuration?.vault.token?.address)
	);
};
