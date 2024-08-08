import {createContext, useContext, useMemo} from 'react';
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
	isApproved: boolean;
	isApproving: boolean;
	canDeposit: boolean;
	isDepositing: boolean;
	isWithdrawing: boolean;
	allowance: bigint;
	permitSignature?: TPermitSignature;
	onApprove: (onSuccess?: () => void, onFailure?: () => void) => Promise<boolean>;
	onDeposit: (onSuccess?: () => void, onFailure?: () => void) => Promise<boolean>;
	onWithdraw: (onSuccess?: () => void, onFailure?: () => void) => Promise<boolean>;

	canZap: boolean;
	isFetchingQuote: boolean;
	quote: TPortalsEstimate | null;
};

/**
 * Return type of the solver context. It consists of 2 parts:
 * 1. Current solver actions
 * 2. Current solver withdraw actions (same for every solver)
 */
const SolverContext = createContext<TSolverContextBase>({
	isApproved: false,
	isApproving: false,
	canDeposit: false,
	isDepositing: false,
	isWithdrawing: false,
	canZap: false,
	isFetchingQuote: false,
	allowance: 0n,
	quote: null,
	onApprove: async (): Promise<boolean> => false,
	onDeposit: async (): Promise<boolean> => false,
	onWithdraw: async (): Promise<boolean> => false
});

function WithContexts({children}: {children: ReactElement}): ReactElement {
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

	return <SolverContext.Provider value={{...currentSolver}}>{children}</SolverContext.Provider>;
}
export function SolverContextApp(props: {children: ReactElement}): ReactElement {
	return (
		<SafeProvider>
			<WithContexts {...props} />
		</SafeProvider>
	);
}

export const useSolver = (): TSolverContextBase => useContext(SolverContext);
