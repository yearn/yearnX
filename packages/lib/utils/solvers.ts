import type {TAddress} from '@lib/types';

export type TInitSolverArgs = {
	chainID: number;
	version: string;
	from: TAddress;
	inputToken: TAddress;
	outputToken: TAddress;
	inputAmount: bigint;
	isDepositing: boolean;
	migrator?: TAddress;
	stakingPoolAddress?: TAddress; //Address of the staking pool, for veYFI zap in
};
