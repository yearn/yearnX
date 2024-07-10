import {createContext, useContext, useMemo} from 'react';
import {zeroNormalizedBN} from '@builtbymom/web3/utils';
import {defaultTxStatus, type TTxStatus} from '@builtbymom/web3/utils/wagmi';
import {useIsZapNeeded} from '@lib/hooks/useIsZapNeeded';
import {usePortalsSolver} from '@lib/solvers/usePortalsSolver';
import {useVanilaSolver} from '@lib/solvers/useVanilaSolver';

import {useManageVaults} from './useManageVaults';

import type {ReactElement} from 'react';
import type {TNormalizedBN} from '@builtbymom/web3/types';
import type {TPortalsEstimate} from '@lib/utils/api.portals';

/**************************************************************************************************
 * This type is a return type of every solver. It should stay the same for every new solver added
 *************************************************************************************************/
export type TSolverContextBase = {
	/** Approval part */
	approvalStatus: TTxStatus;
	onApprove: (onSuccess: () => void) => Promise<void>;
	allowance: TNormalizedBN;
	isDisabled: boolean;
	isApproved: boolean;
	isFetchingAllowance: boolean;

	/** Deposit part */
	depositStatus: TTxStatus;
	onExecuteDeposit: (onSuccess: () => void) => Promise<void>;
	set_depositStatus: (value: TTxStatus) => void;

	isFetchingQuote: boolean;
	quote: TPortalsEstimate | null;
};

/**
 * Return type of the solver context. It consists of 2 parts:
 * 1. Current solver actions
 * 2. Current solver withdraw actions (same for every solver)
 */
type TSolverContext = TSolverContextBase;

const SolverContext = createContext<TSolverContext>({
	approvalStatus: defaultTxStatus,
	onApprove: async (): Promise<void> => undefined,
	allowance: zeroNormalizedBN,
	isDisabled: false,
	isApproved: false,
	isFetchingAllowance: false,

	// withdrawStatus: defaultTxStatus,
	// onExecuteWithdraw: async (): Promise<void> => undefined,
	// set_withdrawStatus: (): void => undefined,

	depositStatus: defaultTxStatus,
	set_depositStatus: (): void => undefined,
	onExecuteDeposit: async (): Promise<void> => undefined,

	isFetchingQuote: false,
	quote: null
});

export function SolverContextApp({children}: {children: ReactElement}): ReactElement {
	const vanila = useVanilaSolver();
	const portals = usePortalsSolver();

	const {configuration} = useManageVaults();

	const isZapNeeded = useIsZapNeeded();

	const currentSolver = useMemo(() => {
		if (!isZapNeeded) {
			return vanila;
		}
		if (configuration?.tokenToSpend.token?.chainID === configuration?.vault?.chainID) {
			return portals;
		}

		return vanila;
	}, [configuration?.tokenToSpend.token?.chainID, configuration?.vault?.chainID, isZapNeeded, portals, vanila]);

	return <SolverContext.Provider value={{...currentSolver}}>{children}</SolverContext.Provider>;
}
export const useSolvers = (): TSolverContext => useContext(SolverContext);
