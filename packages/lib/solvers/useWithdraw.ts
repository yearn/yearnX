import {useCallback, useState} from 'react';
import {VAULT_FILTER} from 'packages/optimism/constants';
// import {useVaults} from 'packages/gimme/contexts/useVaults';
import {isAddressEqual} from 'viem';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {assert, toAddress} from '@builtbymom/web3/utils';
import {defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {useManageVaults} from '@lib/contexts/useManageVaults';
import {useFetchYearnVaults} from '@lib/hooks/useYearnVaults';
// import {useEarnFlow} from '@gimmmeSections/Earn/useEarnFlow';
import {redeemV3Shares, withdrawShares} from '@lib/utils/actions';
import {useDeepCompareMemo} from '@react-hookz/web';

import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';

export type TWithdrawSolverHelper = {
	withdrawStatus: TTxStatus;
	set_withdrawStatus: (value: TTxStatus) => void;
	onExecuteWithdraw: (onSuccess: () => void) => Promise<void>;
};

/**************************************************************************************************
 * As long as Withdraw logic is shared between every solver, it makes sense to keep it
 * outside of solver hooks and reuse
 *************************************************************************************************/
export const useWithdraw = (): TWithdrawSolverHelper => {
	const {configuration} = useManageVaults();
	const {vaults} = useFetchYearnVaults(VAULT_FILTER);
	const vaultsArray = useDeepCompareMemo(() => Object.values(vaults), [vaults]);

	const {provider} = useWeb3();

	const [withdrawStatus, set_withdrawStatus] = useState<TTxStatus>(defaultTxStatus);

	/*********************************************************************************************
	 ** Trigger a withdraw web3 action using the vault contract to take back some underlying token
	 ** from this specific vault.
	 *********************************************************************************************/
	const onExecuteWithdraw = useCallback(
		async (onSuccess: () => void): Promise<void> => {
			assert(configuration?.tokenToReceive?.token, 'Output token is not set');
			assert(configuration?.tokenToReceive?.amount?.display, 'Input amount is not set');
			const vault = vaultsArray.find(vault =>
				isAddressEqual(vault.token.address, toAddress(configuration?.tokenToReceive?.token?.address))
			);
			if (!vault) {
				throw new Error('Vault not found');
			}
			const isV3 = vault.version.split('.')?.[0] === '3';

			set_withdrawStatus({...defaultTxStatus, pending: true});

			let result;
			if (isV3) {
				result = await redeemV3Shares({
					connector: provider,
					chainID: vault.chainID,
					contractAddress: configuration?.vault?.address,
					amount: configuration.tokenToReceive?.amount?.raw
				});
			} else {
				result = await withdrawShares({
					connector: provider,
					chainID: vault.chainID,
					contractAddress: configuration?.vault?.token.address,
					amount: configuration?.tokenToReceive?.amount?.raw
				});
			}

			if (result.isSuccessful) {
				onSuccess();
				set_withdrawStatus({...defaultTxStatus, success: true});
				return;
			}
			set_withdrawStatus({...defaultTxStatus, error: true});
		},
		[
			configuration.tokenToReceive?.amount?.display,
			configuration.tokenToReceive?.amount?.raw,
			configuration.tokenToReceive?.token,
			configuration?.vault?.address,
			configuration?.vault?.token.address,
			provider,
			vaultsArray
		]
	);

	return {
		withdrawStatus,
		set_withdrawStatus,
		onExecuteWithdraw
	};
};
