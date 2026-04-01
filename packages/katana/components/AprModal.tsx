import {type ReactElement} from 'react';
import Image from 'next/image';
import {ModalWrapper} from '@lib/components/common/ModalWrapper';
import {IconCross} from '@lib/components/icons/IconCross';
import {formatAmount} from '@lib/utils';
import {toPercent} from '@lib/utils/tools';

import type {TAprData} from '@lib/hooks/useKatanaAprs';
import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';

type TAprModal = {
	isOpen: boolean;
	onClose: () => void;
	vault: TYDaemonVault;
	apr?: TAprData;
	steerRewardPoints?: number;
	isEligibleForSpectraBoost?: boolean;
};

export function AprModal({isOpen, onClose, vault, apr, steerRewardPoints, isEligibleForSpectraBoost}: TAprModal): ReactElement {
	const katanaAppRewardsAPR = apr?.katanaAppRewardsAPR || 0;
	const fixedRateKatanaRewardsAPR = apr?.fixedRateKatanaRewards || 0;
	const katanaNativeYield = vault.apr.forwardAPR.netAPR || apr?.katanaNativeYield || 0;
	const hasFixedRateRewards = fixedRateKatanaRewardsAPR > 0;
	const hasAppRewards = katanaAppRewardsAPR > 0;
	const hasSteerPoints = (steerRewardPoints ?? 0) > 0;

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

				{/* APR Breakdown */}
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
								<span className={'text-[14px] font-medium text-white'}>{'Est. Native APY'}</span>
							</div>
							<span className={'text-[14px] text-white'}>{toPercent(katanaNativeYield)}</span>
						</div>
						<p className={'text-left text-[12px] text-white/60'}>{'Yield Earned on Katana'}</p>
					</div>

					{hasFixedRateRewards ? (
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
								<span className={'text-[14px] text-white'}>{toPercent(fixedRateKatanaRewardsAPR)}</span>
							</div>
							<p className={'text-left text-[12px] text-white/60'}>{'Limited time KAT rewards'}</p>
							<p className={'text-left text-[12px] text-white/60'}>
								{'* claimable after 28 days, subject to '}
								<a
									href={'https://x.com/katana/status/1961475531188126178'}
									target={'_blank'}
									rel={'noopener noreferrer'}
									className={'text-accentText underline'}>
									{'haircut schedule.'}
								</a>
							</p>
						</div>
					) : null}

					{hasAppRewards ? (
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
								{'KAT rewards passed through from apps'}
							</p>
						</div>
					) : null}
				</div>

				<div className={'rounded-[12px] px-4 pb-4 pt-2'}>
					<p className={'text-left text-[12px] font-medium leading-[1.21] text-white/50'}>
						{'Read more about KAT tokenomics '}
						<a
							href={'https://katana.network/blog/the-network-is-katana-the-token-is-kat'}
							target={'_blank'}
							rel={'noopener noreferrer'}
							className={'text-accentText underline'}>
							{'here.'}
						</a>
					</p>

					{isEligibleForSpectraBoost && (
						<>
							<div className={'my-2 h-px w-full bg-white/20'} />
							<p className={'mb-1 text-left text-[10px] font-semibold uppercase tracking-wide text-white/50'}>
								{'Earn Boosted Yield with Spectra'}
							</p>
							<p className={'text-left text-[12px] text-white/50'}>
								{'Earn boosted yield on Spectra if you '}
								<a
									href={'https://app.spectra.finance/pools?networks=katana'}
									target={'_blank'}
									rel={'noopener noreferrer'}
									className={'text-accentText underline'}>
									{'deposit to their protocol'}
								</a>
								{'.'}
							</p>
						</>
					)}

					{hasSteerPoints ? (
						<>
							<div className={'my-2 h-px w-full bg-white/20'} />
							<p className={'mb-1 text-left text-[10px] font-semibold uppercase tracking-wide text-white/50'}>
								{'Steer Points'}
							</p>
							<p className={'text-left text-[12px] text-white/50'}>
								{'This vault earns '}
								{formatAmount(steerRewardPoints ?? 0, 2, 2)}
								{' Steer Points / dollar deposited, but you must '}
								<a
									className={'text-accentText underline'}
									href={'https://app.steer.finance/points'}
									target={'_blank'}
									rel={'noreferrer'}>
									{'register here to earn them.'}
								</a>
							</p>
						</>
					) : null}
				</div>
			</div>
		</ModalWrapper>
	);
}
