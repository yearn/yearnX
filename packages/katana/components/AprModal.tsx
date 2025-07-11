import {type ReactElement} from 'react';
import Image from 'next/image';
import {ModalWrapper} from '@lib/components/common/ModalWrapper';
import {IconCross} from '@lib/components/icons/IconCross';
import {formatAmount} from '@lib/utils';

import {useKatanaAprs} from '../hooks/useKatanaAprs';

import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';

type TAprModal = {
	isOpen: boolean;
	onClose: () => void;
	vault: TYDaemonVault;
};

export function AprModal({isOpen, onClose, vault}: TAprModal): ReactElement {
	const {data: aprs} = useKatanaAprs();

	const katanaRewardsAPY = aprs?.[vault.address]?.apr?.extra?.katanaRewardsAPR || 0;
	const totalAPY = aprs?.[vault.address]?.apr?.netAPR || 0 + katanaRewardsAPY;

	return (
		<ModalWrapper
			isOpen={isOpen}
			onClose={onClose}>
			<div className={'relative flex w-[320px] flex-col gap-[10px] rounded-[16px] bg-[#353535] p-4 pb-2'}>
				<div className={'mb-4 flex items-center justify-between'}>
					<h2 className={'text-lg font-medium text-white'}>{'APR Breakdown'}</h2>
					<button
						onClick={onClose}
						className={'text-neutral-500 transition-colors hover:text-neutral-700'}>
						<IconCross className={'size-5'} />
					</button>
				</div>

				<div className={'flex flex-col gap-2 rounded-[12px] bg-[#494949] pb-2'}>
					<div className={'flex h-[48px] items-center justify-between rounded-[12px] bg-white/10 px-4'}>
						<span className={'text-[16px] font-medium text-white'}>{'Rewards'}</span>
						<span className={'w-[125px] text-right text-[16px] text-white'}>
							{`${formatAmount(totalAPY * 100, 2, 2)}%`}
						</span>
					</div>

					{katanaRewardsAPY > 0 && (
						<div className={'flex h-[32px] items-center justify-between rounded-[12px] px-4'}>
							<div className={'flex items-center gap-[10px]'}>
								<Image
									src={'/tokens/0x6E9C1F88a960fE63387eb4b71BC525a9313d8461/logo.jpg'}
									alt={'KAT'}
									className={'size-5 rounded-full'}
									width={20}
									height={20}
								/>
								<span className={'text-[14px] font-medium text-white'}>{'KAT'}</span>
							</div>
							<span className={'w-[125px] text-right text-[14px] text-white/75'}>
								{`${formatAmount(katanaRewardsAPY * 100, 2, 2)}%`}
							</span>
						</div>
					)}
				</div>

				<div className={'rounded-[12px] px-2 pt-2 text-center'}>
					<p className={'h-[53px] text-[12px] font-medium leading-[1.21] text-white/50'}>
						{'APR calculations are based on the fees and rewards generated over the past 24 hours.'}
					</p>
				</div>
			</div>
		</ModalWrapper>
	);
}
