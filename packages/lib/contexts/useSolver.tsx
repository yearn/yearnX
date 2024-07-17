import {createContext, useContext, useMemo} from 'react';
import {zeroNormalizedBN} from '@builtbymom/web3/utils';
import {defaultTxStatus, type TTxStatus} from '@builtbymom/web3/utils/wagmi';
import {useIsZapNeeded} from '@lib/hooks/useIsZapNeeded';
import {usePortalsSolver} from '@lib/solvers/usePortalsSolver';
import {useVanilaSolver} from '@lib/solvers/useVanilaSolver';
import {useWithdraw} from '@lib/solvers/useWithdraw';

import {useManageVaults} from './useManageVaults';

import type {ReactElement} from 'react';
import type {TNormalizedBN} from '@builtbymom/web3/types';
import type {TWithdrawSolverHelper} from '@lib/solvers/useWithdraw';
import type {TPortalsEstimate} from '@lib/utils/api.portals';

/**************************************************************************************************
 * This type is a return type of every solver. It should stay the same for every new solver added
 *************************************************************************************************/
export type TSolverContextBase = {
	/** Approval part */
	approvalStatus: TTxStatus;
	onApprove: (onSuccess?: () => void) => Promise<void>;
	allowance: TNormalizedBN;
	isDisabled: boolean;
	isApproved: boolean;
	isFetchingAllowance: boolean;

	/** Deposit part */
	depositStatus: TTxStatus;
	onExecuteDeposit: (onSuccess: () => void) => Promise<void>;
	set_depositStatus: (value: TTxStatus) => void;

	/** Withdraw part */
	withdrawStatus: TTxStatus;
	set_withdrawStatus: (value: TTxStatus) => void;
	onExecuteWithdraw: (onSuccess: () => void) => Promise<void>;

	canZap: boolean;
	isFetchingQuote: boolean;
	quote: TPortalsEstimate | null;
};

/**
 * Return type of the solver context. It consists of 2 parts:
 * 1. Current solver actions
 * 2. Current solver withdraw actions (same for every solver)
 */
type TSolverContext = Partial<TSolverContextBase & TWithdrawSolverHelper>;

const SolverContext = createContext<TSolverContext>({
	approvalStatus: defaultTxStatus,
	onApprove: async (): Promise<void> => undefined,
	allowance: zeroNormalizedBN,
	isDisabled: false,
	isApproved: false,
	isFetchingAllowance: false,

	withdrawStatus: defaultTxStatus,
	set_withdrawStatus: (): void => undefined,
	onExecuteWithdraw: async (): Promise<void> => undefined,

	depositStatus: defaultTxStatus,
	set_depositStatus: (): void => undefined,
	onExecuteDeposit: async (): Promise<void> => undefined,

	isFetchingQuote: false,
	quote: null
});

export function SolverContextApp({children}: {children: ReactElement}): ReactElement {
	const {configuration} = useManageVaults();
	const {isZapNeededForDeposit, isZapNeededForWithdraw} = useIsZapNeeded(configuration);
	const vanila = useVanilaSolver(isZapNeededForDeposit, isZapNeededForWithdraw);
	const portals = usePortalsSolver(isZapNeededForDeposit, isZapNeededForWithdraw);
	const withdrawHelper = useWithdraw();

	const currentSolver = useMemo(() => {
		if (isZapNeededForDeposit && configuration.action === 'DEPOSIT') {
			return portals;
		}
		if (isZapNeededForWithdraw && configuration.action === 'WITHDRAW') {
			return portals;
		}
		return vanila;
	}, [configuration.action, isZapNeededForDeposit, isZapNeededForWithdraw, portals, vanila]);

	const contextValue = isZapNeededForWithdraw ? {...currentSolver} : {...currentSolver, ...withdrawHelper};

	return <SolverContext.Provider value={contextValue}>{children}</SolverContext.Provider>;
}
export const useSolver = (): TSolverContext => useContext(SolverContext);
