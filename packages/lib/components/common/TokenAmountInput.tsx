import {type ReactElement, useMemo} from 'react';
import InputNumber from 'rc-input-number';
import {serialize} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, formatAmount, toNormalizedBN} from '@builtbymom/web3/utils';
import {createUniqueID} from '@lib/utils/tools.identifiers';

import {ChainSelector} from './ChainSelector';

import type {TYDaemonVault} from '@lib/hooks/useYearnVaults.types';

type TTokenAmountInputProps = {
	label: string;
	vault: TYDaemonVault;
};

function TokenAmountInput(props: TTokenAmountInputProps): ReactElement {
	const {label, vault} = props;

	const {address, onConnect} = useWeb3();
	return (
		<div className={'flex w-full gap-x-2'}>
			<div className={'h-full'}>
				<ChainSelector vault={vault} />
			</div>
			<label
				className={cl(
					'z-20 !h-16 relative transition-all border border-white/15',
					'flex flex-row items-center cursor-text',
					'focus:placeholder:text-neutral-300 placeholder:transition-colors',
					'p-2 px-4 group border-white/15 bg-white/5 rounded-lg'
				)}>
				<div className={'relative w-full pr-2'}>
					<InputNumber
						prefixCls={cl(
							'w-full h-full focus:border-none rounded-lg border-none bg-transparent text-xl transition-colors',
							'placeholder:text-white/20 focus:placeholder:text-white/30',
							'placeholder:transition-colors'
						)}
						min={0}
						step={0.1}
						decimalSeparator={'.'}
						placeholder={'0.00'}
						controls={false}
					/>
				</div>
				<button className={'rounded-lg border border-white/15 bg-white/5 p-2 text-white'}>{'Max'}</button>
			</label>

			<div className={'w-[120px]'}>
				<button
					onClick={address ? () => {} : onConnect}
					className={cl(
						'text-background flex w-full justify-center whitespace-nowrap rounded-lg bg-white px-[34.5px] py-5 font-bold',
						!address ? '!w-32' : ''
					)}>
					{address ? label : 'Connect wallet'}
				</button>
			</div>
		</div>
	);
}

export function TokenAmountWrapper({label, vault}: {label: string; vault: TYDaemonVault}): ReactElement {
	const {balances, getBalance} = useWallet();

	/**********************************************************************************************
	 ** Balances is an object with multiple level of depth. We want to create a unique hash from
	 ** it to know when it changes. This new hash will be used to trigger the useEffect hook.
	 ** We will use classic hash function to create a hash from the balances object.
	 *********************************************************************************************/
	const currentBalanceIdentifier = useMemo(() => {
		const hash = createUniqueID(serialize(balances));
		return hash;
	}, [balances]);
	/**********************************************************************************************
	 ** Retrieve the user's balance for the current vault. We will use the getBalance function
	 ** from the useWallet hook to retrieve the balance. We are using currentBalanceIdentifier as a
	 ** dependency to trigger the useEffect hook when the balances object changes.
	 *********************************************************************************************/
	const balance = useMemo(() => {
		currentBalanceIdentifier;
		const value = getBalance({address: vault.address, chainID: vault.chainID}).normalized || 0;
		return value;
	}, [getBalance, vault.address, vault.chainID, currentBalanceIdentifier]);
	return (
		<>
			<p>{label}</p>
			<TokenAmountInput
				vault={vault}
				label={label}
			/>
			<div className={'text-neutral-0 text-right text-xs text-opacity-40'}>
				{`Available: ${formatAmount(balance * toNormalizedBN(vault.pricePerShare, vault.decimals).normalized)} ${vault.token.symbol}`}
			</div>
		</>
	);
}
