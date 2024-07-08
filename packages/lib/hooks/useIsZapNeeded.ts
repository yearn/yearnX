import {isAddress} from '@builtbymom/web3/utils';
import {useManageVaults} from '@lib/contexts/useManageVaults';

import type {TToken} from '@builtbymom/web3/types';

export const useIsZapNeeded = (asset: TToken): boolean => {
	const {configuration} = useManageVaults();
	return (
		isAddress(asset.address) &&
		isAddress(configuration.vault?.token.address) &&
		asset.address !== configuration.vault?.token.address
	);
};
