import {createContext, useContext, useMemo} from 'react';
import {defaultTxStatus, type TTxStatus} from '@builtbymom/web3/utils/wagmi';
import SafeProvider from '@gnosis.pm/safe-apps-react-sdk';
import {useIsZapNeeded} from '@lib/hooks/useIsZapNeeded';
import {usePortalsSolver} from '@lib/solvers/usePortalsSolver';
import {useVanilaSolver} from '@lib/solvers/useVanilaSolver';

import {useManageVaults} from './useManageVaults';

import type {ReactElement} from 'react';
import type {TPermitSignature} from '@builtbymom/web3/hooks/usePermit.types';
import type {TPortalsEstimate} from '@lib/utils/api.portals';

/**************************************************************************************************
 * This type is a return type of every solver. It should stay the same for every new solver added
 *************************************************************************************************/
export type TSolverContextBase = {
	/** Approval part */
	onApprove: (onSuccess?: () => void, onFailure?: () => void) => Promise<void>;
	allowance: bigint;
	permitSignature?: TPermitSignature;
	isApproved: boolean;
	isApproving: boolean;

	/** Deposit part */
	depositStatus: TTxStatus;
	onExecuteDeposit: (onSuccess: () => void) => Promise<void>;
	set_depositStatus: (value: TTxStatus) => void;

	/** Withdraw part */
	withdrawStatus: TTxStatus;
	set_withdrawStatus: (value: TTxStatus) => void;
	onExecuteWithdraw: (onSuccess: () => void) => Promise<void>;
	onDepositForGnosis: (onSuccess?: () => void) => Promise<void>;

	canZap: boolean;
	isFetchingQuote: boolean;
	quote: TPortalsEstimate | null;
};

/**
 * Return type of the solver context. It consists of 2 parts:
 * 1. Current solver actions
 * 2. Current solver withdraw actions (same for every solver)
 */
type TSolverContext = Partial<TSolverContextBase>;

const SolverContext = createContext<Partial<TSolverContextBase>>({
	onApprove: async (): Promise<void> => undefined,
	allowance: 0n,
	isApproved: false,
	isApproving: false,

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

	const currentSolver = useMemo(() => {
		if (isZapNeededForDeposit && configuration.action === 'DEPOSIT') {
			return portals;
		}
		if (isZapNeededForWithdraw && configuration.action === 'WITHDRAW') {
			return portals;
		}
		return vanila;
	}, [configuration.action, isZapNeededForDeposit, isZapNeededForWithdraw, portals, vanila]);

	return (
		<SafeProvider>
			<SolverContext.Provider value={{...currentSolver}}>{children}</SolverContext.Provider>
		</SafeProvider>
	);
}
export const useSolver = (): TSolverContext => useContext(SolverContext);
