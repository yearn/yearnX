import React from 'react';
import {useGrandPrize, usePrizePool} from '@generationsoftware/hyperstructure-react-hooks';
import {DefaultHeader} from '@lib/components/common/DefaultHeader';
import {Footer} from '@lib/components/common/Footer';
import {VaultList} from '@lib/components/common/VaultList';
import {useFetchYearnVaults} from '@lib/hooks/useYearnVaults';
import {Section} from '@lib/sections';
import {toAddress, toBigInt, toNormalizedBN} from '@lib/utils';
import {useDeepCompareMemo} from '@react-hookz/web';

import {APY_TYPE, VARIANT_TO_USE, VAULT_FILTER} from '../constants';

import type {ReactElement} from 'react';

export default function Home(): ReactElement {
	const {vaults, isLoading} = useFetchYearnVaults(VAULT_FILTER);
	const vaultsValues = useDeepCompareMemo(() => Object.values(vaults), [vaults]);

	const prizePool = usePrizePool(10, toAddress('0xF35fE10ffd0a9672d0095c435fd8767A7fe29B55'));
	const {data: grandPrize} = useGrandPrize(prizePool);

	return (
		<section className={'flex w-full max-w-[1200px] flex-col gap-y-6 pb-6'}>
			<DefaultHeader
				docsLink={'https://docs.yearn.fi/'}
				secondLogoURL={'/partnerLogo.png'}
			/>
			<Section
				variant={VARIANT_TO_USE}
				bgImage={'/bg.png'}
				title={'Yearn Prize Vaults'}
				description={'Deposit into one of the Prize Vaults to get a chance to win the grand prize!'}
				cards={[
					{
						title: 'GRAND PRIZE',
						currency: grandPrize?.symbol || '',
						value: toNormalizedBN(toBigInt(grandPrize?.amount), grandPrize?.decimals || 18).normalized,
						decimals: grandPrize?.decimals || 18,
						isReady: !!grandPrize
					}
				]}
			/>

			<VaultList
				vaults={vaultsValues}
				isLoading={isLoading}
				options={{
					apyType: APY_TYPE
				}}
			/>

			<Footer docsLink={'https://docs.pooltogether.com/welcome/faq'} />
		</section>
	);
}
