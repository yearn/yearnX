import {describe, expect, it} from 'vitest';

import {normalizeKatanaAprs} from './useKatanaAprs';

describe('normalizeKatanaAprs', () => {
	it('keeps the live fixed-rate rewards field name', () => {
		const normalizedAprs = normalizeKatanaAprs({
			'0xvault': {
				apr: {
					netAPR: 0.4039060922646386,
					extra: {
						stakingRewardsAPR: null,
						gammaRewardAPR: null,
						katanaRewardsAPR: 0.036415935103465066,
						katanaAppRewardsAPR: 0.036415935103465066,
						fixedRateKatanaRewards: 0.35,
						katanaBonusAPY: 0.068,
						katanaNativeYield: 0.03390609226463859,
						steerPointsPerDollar: 0.18
					}
				}
			}
		});

		expect(normalizedAprs['0xvault']?.apr.extra.fixedRateKatanaRewards).toBe(0.35);
		expect(normalizedAprs['0xvault']?.apr.extra).not.toHaveProperty('FixedRateKatanaRewards');
	});

	it('maps the legacy fixed-rate rewards field without double counting it', () => {
		const normalizedAprs = normalizeKatanaAprs({
			'0xvault': {
				apr: {
					netAPR: 0.18687250816600576,
					extra: {
						stakingRewardsAPR: null,
						gammaRewardAPR: null,
						katanaRewardsAPR: 0.022714370298222892,
						katanaAppRewardsAPR: 0.022714370298222892,
						FixedRateKatanaRewards: 0.14,
						katanaBonusAPY: 0.016,
						katanaNativeYield: 0.02415813786778287,
						steerPointsPerDollar: 0.1546
					}
				}
			}
		});

		const normalizedExtra = normalizedAprs['0xvault']!.apr.extra;
		const totalAPR =
			normalizedExtra.stakingRewardsAPR +
			normalizedExtra.gammaRewardAPR +
			normalizedExtra.katanaAppRewardsAPR +
			normalizedExtra.fixedRateKatanaRewards +
			normalizedExtra.katanaNativeYield;

		expect(normalizedAprs['0xvault']?.apr.extra.fixedRateKatanaRewards).toBe(0.14);
		expect(totalAPR).toBeCloseTo(0.18687250816600576);
	});
});
