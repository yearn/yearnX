import {type ReactElement, useEffect, useMemo} from 'react';
import {Footer} from 'packages/katana/components/KatanaFooter';
import {KatanaHeader} from 'packages/katana/components/KatanaHeader';
import {VaultList} from 'packages/katana/components/KatanaVaultList';
import useWallet from '@lib/contexts/useWallet';
import {useWeb3} from '@lib/contexts/useWeb3';
import {useFetchYearnVaults} from '@lib/hooks/useYearnVaults';
import {Section} from '@lib/sections';
import {toAddress, zeroNormalizedBN} from '@lib/utils';
import {calculateKatanaTotalApr, hasKatanaExtras} from '@lib/utils/katanaApr';
import {useDeepCompareMemo} from '@react-hookz/web';

import {APY_TYPE, PROJECT_DESCRIPTION, PROJECT_TITLE, VARIANT_TO_USE, VAULT_FILTER} from '../constants';

import type {TDict, TToken} from '@lib/types';

export default function Index(): ReactElement {
	const {vaults, isLoading} = useFetchYearnVaults(VAULT_FILTER, [747474]);
	const {onRefreshWithList} = useWallet();
	const {address} = useWeb3();

	const vaultsValues = useDeepCompareMemo(() => Object.values(vaults), [vaults]);

	const sumOfTVL = useMemo(() => {
		if (vaultsValues.length === 0) {
			return 0;
		}
		return vaultsValues.reduce((acc, vault) => acc + vault.tvl.tvl, 0);
	}, [vaultsValues]);

	const upToAPY = useMemo(() => {
		if (vaultsValues.length === 0) {
			return 0;
		}
		const apys = vaultsValues.map(vault => {
			const base30d = vault.apr.points.monthAgo || vault.apr.points.weekAgo;
			if (hasKatanaExtras(vault.apr.extra) && base30d) {
				const total = calculateKatanaTotalApr(vault.apr.extra, base30d);
				return (total ?? base30d) * 100;
			}
			return (base30d || vault.apr.netAPR) * 100;
		});
		return Math.max(...apys);
	}, [vaultsValues]);

	const upToBoost = useMemo(() => {
		if (vaultsValues.length === 0) {
			return 0;
		}
		const boost = vaultsValues.map(vault => vault.apr.forwardAPR.composite.boost);
		return Math.max(...boost);
	}, [vaultsValues]);

	useEffect(() => {
		if (isLoading) {
			return;
		}
		const underlyingTokens: TDict<TToken> = {};
		vaultsValues.forEach(vault => {
			const tokenAddress = toAddress(vault.token.address);
			underlyingTokens[tokenAddress] = {
				address: vault.token.address,
				name: vault.token.name,
				symbol: vault.token.symbol,
				decimals: vault.token.decimals,
				chainID: vault.chainID,
				logoURI: undefined,
				value: 0,
				balance: zeroNormalizedBN
			};
		});
		onRefreshWithList(underlyingTokens);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [vaults.length, isLoading, address]);

	return (
		<section className={'flex w-full max-w-screen-xl flex-col gap-y-6'}>
			<KatanaHeader secondLogoURL={'/katanaTypemark.png'} />
			<Section
				variant={VARIANT_TO_USE}
				bgImage={'/bg3.png'}
				title={PROJECT_TITLE}
				description={PROJECT_DESCRIPTION}
				cards={[
					{title: 'TVL', currency: 'USD', value: sumOfTVL, decimals: 0, isReady: sumOfTVL > 0},
					{title: 'APY up to', currency: '%', value: upToAPY, decimals: 2, isReady: upToAPY > 0},
					{title: 'Boost up to', currency: 'x', value: upToBoost, decimals: 2, isReady: upToAPY > 0}
				]}
			/>
			<VaultList
				vaults={vaultsValues}
				isLoading={isLoading}
				options={{
					apyType: APY_TYPE,
					shouldDisplaySubAPY: APY_TYPE === 'ESTIMATED'
				}}
			/>
			<Footer />
		</section>
	);
}
