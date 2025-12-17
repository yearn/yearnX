import {type ReactElement} from 'react';
import Image from 'next/image';
import {ModalWrapper} from '@lib/components/common/ModalWrapper';
import {IconCross} from '@lib/components/icons/IconCross';
import {formatAmount} from '@lib/utils';
import {toPercent} from '@lib/utils/tools';

import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';
import type {TAprData} from '../hooks/useKatanaAprs';

type TAprModal = {
	isOpen: boolean;
	onClose: () => void;
	vault: TYDaemonVault;
	apr?: TAprData;
	steerRewardPoints?: number;
};

export function AprModal({isOpen, onClose, vault, apr, steerRewardPoints}: TAprModal): ReactElement {
	const katanaAppRewardsAPR = apr?.katanaAppRewardsAPR || 0;
	const fixedRateKatanRewardsAPR = apr?.FixedRateKatanaRewards || 0;
	const katanaBonusAPR = apr?.katanaBonusAPY || 0;
	const katanaNativeYield = apr?.katanaNativeYield || 0;

	// Exclude legacy katanaRewardsAPR and non-APR steerPointsPerDollar from totals
	const {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		katanaRewardsAPR: _katanaRewardsAPR,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		steerPointsPerDollar: _points,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		katanaBonusAPY: _bonus,
		...relevantAprs
	} = apr ?? {};
	const totalAPR = Object.values(relevantAprs).reduce((sum, value) => sum + value, 0);

	return (
		<ModalWrapper
			isOpen={isOpen}
			onClose={onClose}>
			<div
				className={
					'relative flex min-h-fit w-[400px] flex-col gap-[10px] rounded-[16px] bg-[#353535] p-4 pb-2'
				}>
				<div className={'mb-4 flex items-center justify-between'}>
					<h2 className={'text-lg font-medium text-white'}>{'Yield Breakdown'}</h2>
					<button
						onClick={onClose}
						className={'text-neutral-500 transition-colors hover:text-neutral-700'}>
						<IconCross className={'size-5'} />
					</button>
				</div>

				{/* Native APY - Group 1 */}
				<div className={'flex flex-col gap-2 rounded-[12px] bg-[#494949] p-4'}>
					<div className={'flex flex-col gap-1'}>
						<div className={'flex items-center justify-between'}>
							<div className={'flex items-center gap-[10px]'}>
								<Image
									src={`/tokens/${vault.token.symbol}/logo.svg`}
									alt={vault.token.symbol}
									className={'size-5 rounded-full'}
									width={20}
									height={20}
								/>
								<span className={'text-[14px] font-medium text-white'}>{'Katana Native Yield'}</span>
							</div>
							<span className={'text-[14px] text-white'}>{toPercent(katanaNativeYield)}</span>
						</div>
						<p className={'text-left text-[12px] text-white/60'}>{'Yield Earned on Katana'}</p>
					</div>
					<div className={'flex flex-col gap-1'}>
						<div className={'flex items-center justify-between'}>
							<div className={'flex items-center gap-[10px]'}>
								<Image
									src={'/tokens/KAT/logo.jpg'}
									alt={'KAT'}
									className={'size-5 rounded-full'}
									width={20}
									height={20}
								/>
								<span className={'text-[14px] font-medium text-white'}>{'Base Rewards APR'}</span>
							</div>
							<span className={'text-[14px] text-white'}>{toPercent(fixedRateKatanRewardsAPR)}</span>
						</div>
						<p className={'text-left text-[12px] text-white/60'}>{'Limited time fixed KAT rewards'}</p>
					</div>

					<div className={'flex flex-col gap-1'}>
						<div className={'flex items-center justify-between'}>
							<div className={'flex items-center gap-[10px]'}>
								<Image
									src={'/tokens/KAT/logo.jpg'}
									alt={'KAT'}
									className={'size-5 rounded-full'}
									width={20}
									height={20}
								/>
								<span className={'text-[14px] font-medium text-white'}>{'App Rewards APR'}</span>
							</div>
							<span className={'text-[14px] text-white'}>{toPercent(katanaAppRewardsAPR)}</span>
						</div>
						<p className={'text-left text-[12px] text-white/60'}>
							{'KAT Rewards passed through from Apps'}
						</p>
					</div>

					<div className={'flex flex-col gap-1'}>
						<div className={'flex items-center justify-between'}>
							<div className={'flex items-center gap-[10px]'}>
								<Image
									src={'/tokens/KAT/logo.jpg'}
									alt={'KAT'}
									className={'size-5 rounded-full'}
									width={20}
									height={20}
								/>
								<span className={'text-[14px] font-medium text-white/60'}>{'Deposit Bonus APR'}</span>
							</div>
							<span className={'text-[14px] text-white/60'}>{toPercent(katanaBonusAPR)}</span>
						</div>
						<p className={'text-left text-[12px] text-white/60'}>
							{'Applied if you deposited before Sept. 1st and hold for 90 days'}
						</p>
					</div>
				</div>

				{/* Combined APR - Group 3 */}
				<div className={'flex flex-col gap-2 rounded-[12px] bg-white/10 p-4'}>
					<div className={'flex items-center justify-between'}>
						<span className={'text-[16px] font-bold text-white'}>{'Expected Net APR'}</span>
						<span className={'text-[16px] font-bold text-white'}>{toPercent(totalAPR)}</span>
					</div>
					{steerRewardPoints !== undefined && steerRewardPoints > 0 && (
						<div>
							<p className={'text-regularText text-left text-sm leading-relaxed'}>
								{'This vault earns '}
								{formatAmount(steerRewardPoints, 2, 2)}
								{' Steer Points / dollar deposited,'}
							</p>
							<p className={'text-regularText text-left text-sm leading-relaxed'}>
								{'but you must '}
								<a
									className={'text-accentText underline'}
									href={'https://app.steer.finance/points'}
									target={'_blank'}
									rel={'noreferrer'}>
									{'register here to earn them'}
								</a>
								{'.'}
							</p>
						</div>
					)}
				</div>

				<div className={'rounded-[12px] px-4 pb-4 pt-2'}>
					<ul
						className={
							'list-inside list-disc space-y-1 text-left text-[12px] font-medium leading-[1.21] text-white/50'
						}>
						<li>{'KAT tokens are locked until no later than Feb. 20 2026.'}</li>
						<li>{'KAT APR is calculated using an assumed $1B Fully Diluted Valuation.'}</li>
					</ul>
					<p className={'mt-2 text-left text-[12px] font-medium leading-[1.21] text-white/50'}>
						{'Read more about KAT tokenomics '}
						<a
							href={'https://katana.network/blog/the-network-is-katana-the-token-is-kat'}
							target={'_blank'}
							rel={'noopener noreferrer'}
							className={'text-blue-400 underline hover:text-blue-300'}>
							{'here'}
						</a>
					</p>
				</div>
			</div>
		</ModalWrapper>
	);
}
