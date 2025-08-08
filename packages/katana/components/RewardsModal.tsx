import {type ReactElement, useEffect} from 'react';
import Link from 'next/link';
import {RewardsCard} from 'packages/katana/components/RewardsCard';
import {useAngleRewards} from 'packages/katana/hooks/useAngleRewards';
import {ModalWrapper} from '@lib/components/common/ModalWrapper';
import {IconCross} from '@lib/components/icons/IconCross';
import {useWeb3} from '@lib/contexts/useWeb3';

type TRewardsModal = {
	isOpen: boolean;
	onClose: () => void;
};

export function RewardsModal({isOpen, onClose}: TRewardsModal): ReactElement {
	const {address} = useWeb3();
	const {preDepositRewards, currentRewards, isLoading, error, hasRewards, refetch} = useAngleRewards();

	useEffect(() => {
		if (isOpen) {
			refetch();
		}
	}, [isOpen, refetch]);

	return (
		<ModalWrapper
			isOpen={isOpen}
			onClose={onClose}>
			<div className={'relative w-full max-w-md rounded-lg bg-neutral-100 p-6'}>
				<div className={'mb-4 flex items-center justify-between'}>
					<h2 className={'text-xl font-bold text-neutral-900'}>{'Claim Rewards'}</h2>
					<button
						onClick={onClose}
						className={'text-neutral-500 transition-colors hover:text-neutral-700'}>
						<IconCross className={'size-5'} />
					</button>
				</div>

				{isLoading && (
					<div className={'flex items-center justify-center py-8'}>
						<span className={'ml-2 text-neutral-600'}>{'Loading rewards...'}</span>
					</div>
				)}

				{error && (
					<div className={'mb-4 rounded-lg border border-red-200 bg-red-50 p-4'}>
						<p className={'text-sm text-red-700'}>
							{'Error loading rewards: '}
							{error}
						</p>
					</div>
				)}

				{!isLoading && !error && !hasRewards && (
					<div className={'rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center'}>
						<p className={'mb-2 text-neutral-600'}>{'No rewards available'}</p>
						<p className={'text-sm text-neutral-500'}>
							{"You don't have any claimable rewards at the moment."}
						</p>
					</div>
				)}

				{!isLoading && hasRewards && (
					<div className={'space-y-4'}>
						{preDepositRewards.length > 0 && (
							<div className={'space-y-4'}>
								<RewardsCard
									title={'Pre-Deposit Rewards (Polygon)'}
									rewards={preDepositRewards}
									chainId={137}
								/>
							</div>
						)}
						{currentRewards.length > 0 && (
							<div className={'space-y-4'}>
								<RewardsCard
									title={'Current Rewards (Katana)'}
									rewards={currentRewards}
									chainId={747474}
								/>
							</div>
						)}
						<div className={'px-4 text-center text-sm text-neutral-500'}>
							<p className={'text-center'}>
								{'More information can be found at '}
								<Link
									href={`https://app.merkl.xyz/users/${address}`}
									target={'_blank'}
									className={'text-neutral-500 underline transition-colors hover:text-neutral-700'}>
									{'Merkl'}
								</Link>
							</p>
						</div>
					</div>
				)}
			</div>
		</ModalWrapper>
	);
}
