import Image from 'next/image';

import type {ReactElement} from 'react';
import type {TPartner} from '../types';

type TPartnerCardProps = {
	partner: TPartner;
};

export function PartnerCard(props: TPartnerCardProps): ReactElement {
	return (
		<div className={'bg-card-bg w-full rounded-2xl p-10'}>
			{props.partner.icon ? (
				<Image
					src={props.partner.icon}
					alt={props.partner.name}
					width={100}
					height={100}
				/>
			) : (
				<div className={'bg-fallback/30 size-24 rounded-full'} />
			)}
			<div className={'mt-4 flex flex-col gap-y-1'}>
				<span className={'text-regularText text-lg font-bold'}>{props.partner.name}</span>
				<span className={'text-regularText/50 text-sm'}>{props.partner.description}</span>
			</div>
		</div>
	);
}
