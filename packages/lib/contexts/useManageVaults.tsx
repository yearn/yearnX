import {createContext, useContext, useMemo, useReducer} from 'react';
import {zeroAddress} from 'viem';
import {zeroNormalizedBN} from '@lib/utils';
import {optionalRenderProps} from '@lib/utils/optionalRenderProps';

import type {Dispatch, ReactElement} from 'react';
import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';
import type {TNormalizedBN} from '@lib/types';
import type {TOptionalRenderProps} from '@lib/utils/optionalRenderProps';
import type {TAssertedTokenToUse, TTokenToUse} from '@lib/utils/types';

type TVaultsActions =
	| {type: 'SET_TOKEN_TO_SPEND'; payload: TTokenToUse}
	| {type: 'SET_AMOUNT_TO_SPEND'; payload: TNormalizedBN}
	| {type: 'SET_TOKEN_TO_RECEIVE'; payload: TTokenToUse}
	| {type: 'SET_VAULT'; payload: TYDaemonVault}
	| {type: 'SET_DEPOSIT'; payload: {toSpend: TTokenToUse; vault: TYDaemonVault}}
	| {type: 'SET_WITHDRAW'; payload: {toSpend: TTokenToUse; toReceive: TTokenToUse; vault: TYDaemonVault}}
	| {type: 'RESET'};

export type TVaultsConfiguration = {
	action: 'DEPOSIT' | 'WITHDRAW' | undefined;
	tokenToSpend: TTokenToUse;
	tokenToReceive: TTokenToUse;
	vault: TYDaemonVault | undefined;
};

export type TAssertedVaultsConfiguration = {
	action: 'DEPOSIT' | 'WITHDRAW';
	tokenToSpend: TAssertedTokenToUse;
	tokenToReceive: TAssertedTokenToUse;
	vault: TYDaemonVault;
};

export type TVaults = {
	configuration: TVaultsConfiguration;
	dispatchConfiguration: Dispatch<TVaultsActions>;
};

const defaultProps: TVaults = {
	configuration: {
		action: undefined,
		tokenToSpend: {
			token: {
				chainID: 1,
				address: zeroAddress,
				name: '',
				symbol: '',
				decimals: 0,
				value: 0
			},
			amount: zeroNormalizedBN
		},
		tokenToReceive: {
			token: {
				chainID: 1,
				address: zeroAddress,
				name: '',
				symbol: '',
				decimals: 0,
				value: 0
			},
			amount: zeroNormalizedBN
		},
		vault: undefined
	},
	dispatchConfiguration: (): void => undefined
};

const VaultsContext = createContext<TVaults>(defaultProps);

export const VaultsContextApp = ({children}: {children: TOptionalRenderProps<TVaults, ReactElement>}): ReactElement => {
	/**********************************************************************************************
	 ** Reducer function to manage the state of vaults configuration. Handles various actions to
	 ** update the state such as setting tokens, setting vaults, and resetting the configuration.
	 ** Also it sets "WITHDRAW" and "DEPOSIT" actions with all required tokens.
	 *********************************************************************************************/
	const configurationReducer = (state: TVaultsConfiguration, action: TVaultsActions): TVaultsConfiguration => {
		switch (action.type) {
			case 'SET_TOKEN_TO_SPEND': {
				return {
					...state,
					tokenToSpend: {...state?.tokenToSpend, ...action.payload}
				};
			}
			case 'SET_AMOUNT_TO_SPEND': {
				return {
					...state,
					tokenToSpend: {...state?.tokenToSpend, amount: action.payload}
				};
			}
			case 'SET_TOKEN_TO_RECEIVE': {
				return {
					...state,
					tokenToReceive: {...state?.tokenToReceive, ...action.payload}
				};
			}
			case 'SET_VAULT': {
				return {
					...state,
					vault: {...state?.vault, ...action.payload}
				};
			}
			case 'SET_DEPOSIT': {
				return {
					...state,
					action: 'DEPOSIT',
					tokenToSpend: {...state?.tokenToSpend, ...action.payload.toSpend},
					vault: {...state?.vault, ...action.payload.vault}
				};
			}
			case 'SET_WITHDRAW': {
				return {
					...state,
					action: 'WITHDRAW',
					tokenToSpend: {...state?.tokenToSpend, ...action.payload.toSpend},
					tokenToReceive: {...state?.tokenToReceive, ...action.payload.toReceive},
					vault: {...state?.vault, ...action.payload.vault}
				};
			}
			case 'RESET': {
				return defaultProps.configuration;
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
