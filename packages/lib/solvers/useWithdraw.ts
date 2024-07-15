import {useCallback, useState} from 'react';
import useWallet from '@builtbymom/web3/contexts/useWallet';
// import {useVaults} from 'packages/gimme/contexts/useVaults';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {assert, ETH_TOKEN_ADDRESS} from '@builtbymom/web3/utils';
import {defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {useManageVaults} from '@lib/contexts/useManageVaults';
// import {useEarnFlow} from '@gimmmeSections/Earn/useEarnFlow';
import {redeemV3Shares, withdrawShares} from '@lib/utils/actions';

import type {TUseBalancesTokens} from '@builtbymom/web3/hooks/useBalances.multichains';
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
	const {provider} = useWeb3();
	const [withdrawStatus, set_withdrawStatus] = useState<TTxStatus>(defaultTxStatus);
	const {onRefresh} = useWallet();

	const onRefreshTokens = useCallback(() => {
		const tokensToRefresh: TUseBalancesTokens[] = [];

		if (configuration?.tokenToReceive?.token) {
			const {token} = configuration.tokenToReceive;
			tokensToRefresh.push({address: token.address, chainID: token.chainID});
		}
		if (configuration?.tokenToSpend?.token) {
			const {token} = configuration.tokenToSpend;
			tokensToRefresh.push({address: token.address, chainID: token.chainID});
			tokensToRefresh.push({address: ETH_TOKEN_ADDRESS, chainID: token.chainID});
		}
		onRefresh(tokensToRefresh, false, true);
	}, [configuration.tokenToReceive, configuration.tokenToSpend, onRefresh]);

	/*********************************************************************************************
	 ** Trigger a withdraw web3 action using the vault contract to take back some underlying token
	 ** from this specific vault.
	 *********************************************************************************************/
	const onExecuteWithdraw = useCallback(
		async (onSuccess?: () => void): Promise<void> => {
			assert(configuration?.tokenToReceive?.token, 'Output token is not set');
			assert(configuration?.tokenToReceive?.amount?.display, 'Input amount is not set');
			assert(configuration.vault, 'Vault is not set');
			const isV3 = configuration.vault.version.split('.')?.[0] === '3';

			set_withdrawStatus({...defaultTxStatus, pending: true});

			let result;
			if (isV3) {
				result = await redeemV3Shares({
					connector: provider,
					chainID: configuration.vault.chainID,
					contractAddress: configuration?.vault?.address,
					amount: configuration.tokenToReceive?.amount?.raw
				});
			} else {
				result = await withdrawShares({
					connector: provider,
					chainID: configuration.vault.chainID,
					contractAddress: configuration?.vault?.token.address,
					amount: configuration?.tokenToReceive?.amount?.raw
				});
			}

			await onRefreshTokens();
			if (result.isSuccessful) {
				onSuccess?.();
				set_withdrawStatus({...defaultTxStatus, success: true});
				return;
			}
			set_withdrawStatus({...defaultTxStatus, error: true});
		},
		[
			configuration.tokenToReceive?.amount?.display,
			configuration.tokenToReceive?.amount?.raw,
			configuration.tokenToReceive?.token,
			configuration.vault,
			onRefreshTokens,
			provider
		]
	);

	return {
		withdrawStatus,
		set_withdrawStatus,
		onExecuteWithdraw
	};
};
