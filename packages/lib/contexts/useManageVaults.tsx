import {createContext, useContext, useMemo, useReducer} from 'react';
import {zeroAddress} from 'viem';
import {zeroNormalizedBN} from '@builtbymom/web3/utils';
import {optionalRenderProps} from '@lib/utils/optionalRenderProps';

import type {Dispatch, ReactElement} from 'react';
import type {TNormalizedBN, TToken} from '@builtbymom/web3/types';
import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';
import type {TOptionalRenderProps} from '@lib/utils/optionalRenderProps';
import type {TTokenToUse} from '@lib/utils/types';

type TVaultsActions =
	| {
			type: 'SET_ASSET_TO_DEPOSIT';
			payload: Partial<{token: TToken; amount: TNormalizedBN}>;
	  }
	| {type: 'SET_ASSET_TO_WITHDRAW'; payload: Partial<{token: TToken; amount: TNormalizedBN}>}
	| {type: 'SET_VAULT'; payload: TYDaemonVault};

type TVaultsConfiguration = {
	assetToDeposit: TTokenToUse;
	assetToWithdraw: TTokenToUse;
	vault: TYDaemonVault | undefined;
};

export type TVaults = {
	configuration: TVaultsConfiguration;
	dispatchConfiguration: Dispatch<TVaultsActions>;
};

const defaultProps: TVaults = {
	configuration: {
		assetToDeposit: {
			token: {
				chainID: 1,
				address: zeroAddress,
				name: '',
				symbol: '',
				decimals: 0,
				value: 0,
				balance: zeroNormalizedBN
			},
			amount: zeroNormalizedBN
		},
		assetToWithdraw: {
			token: {
				chainID: 1,
				address: zeroAddress,
				name: '',
				symbol: '',
				decimals: 0,
				value: 0,
				balance: zeroNormalizedBN
			},
			amount: zeroNormalizedBN
		},
		vault: undefined
	},
	dispatchConfiguration: (): void => undefined
};

const VaultsContext = createContext<TVaults>(defaultProps);

export const VaultsContextApp = ({children}: {children: TOptionalRenderProps<TVaults, ReactElement>}): ReactElement => {
	const configurationReducer = (state: TVaultsConfiguration, action: TVaultsActions): TVaultsConfiguration => {
		switch (action.type) {
			case 'SET_ASSET_TO_DEPOSIT': {
				return {
					...state,
					assetToDeposit: {...state.assetToDeposit, ...action.payload}
				};
			}
			case 'SET_ASSET_TO_WITHDRAW': {
				return {
					...state,
					assetToWithdraw: {...state.assetToWithdraw, ...action.payload}
				};
			}

			case 'SET_VAULT': {
				return {
					...state,
					vault: {...state.vault, ...action.payload}
				};
			}
		}
	};

	const [configuration, dispatch] = useReducer(configurationReducer, defaultProps.configuration);

	const contextVaule = useMemo(
		(): TVaults => ({
			configuration,
			dispatchConfiguration: dispatch
		}),
		[configuration]
	);

	return (
		<VaultsContext.Provider value={contextVaule}>
			{optionalRenderProps(children, contextVaule)}
		</VaultsContext.Provider>
	);
};

export const useManageVaults = (): TVaults => {
	const ctx = useContext(VaultsContext);

	if (!ctx) {
		throw new Error('VaultsContext not found');
	}

	return ctx;
};
