export type TKatanaExtras = {
	katanaAppRewardsAPR?: number;
	fixedRateKatanaRewards?: number;
	steerPointsPerDollar?: number;
};

export function calculateKatanaTotalApr(
	katanaExtras?: Partial<TKatanaExtras>,
	baseAprOverride?: number
): number | undefined {
	if (!katanaExtras) {
		return undefined;
	}

	const parts = [baseAprOverride, katanaExtras.fixedRateKatanaRewards, katanaExtras.katanaAppRewardsAPR].filter(
		(v): v is number => typeof v === 'number' && !Number.isNaN(v)
	);

	if (parts.length === 0) {
		return undefined;
	}
	return parts.reduce((acc, v) => acc + v, 0);
}
