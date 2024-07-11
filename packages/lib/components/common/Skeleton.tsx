import type {ReactElement} from 'react';

function SkeletonRow(): ReactElement {
	return (
		<>
			<div
				className={
					'bg-regularText/3 hidden h-24 min-h-[68px] place-content-center rounded-xl p-2.5 md:grid md:grid-cols-7'
				}>
				<div
					className={
						'border-regularText/15 bg-regularText/5 col-span-2 grid h-[76px] grid-cols-7 items-center gap-x-4 rounded-xl border px-3 py-2'
					}>
					<div className={'bg-regularText/5 col-span-1 size-8 rounded-full'} />
					<div className={'bg-regularText/5 col-span-4 h-4 w-full rounded-xl'} />
					<div className={'bg-regularText/5 col-span-2 h-4 w-full rounded-xl'} />
				</div>
				<div className={'flex size-full items-center justify-center'}>
					<div className={'bg-regularText/10 col-span-1 h-6 w-1/2 justify-self-center rounded-xl'} />
				</div>
				<div className={'flex size-full items-center justify-end'}>
					<div className={'bg-regularText/10 col-span-1 h-6 w-1/2 justify-self-center rounded-xl'} />
				</div>
				<div className={'flex size-full items-center justify-end'}>
					<div className={'bg-regularText/10 col-span-1 h-6 w-1/2 justify-self-center rounded-xl'} />
				</div>
				<div className={'col-span-2 flex size-full items-center justify-center'}>
					<div
						className={' bg-regularText/10 flex h-6 w-1/2 justify-center justify-self-center rounded-xl'}
					/>
				</div>
			</div>
			<div className={'bg-table flex w-full flex-col gap-y-6 rounded-2xl p-6 md:hidden'}>
				<div
					className={
						'border-regularText/15 bg-regularText/5 col-span-2 grid w-3/4 grid-cols-8 items-center gap-x-4 rounded-xl border px-3 py-2'
					}>
					<div className={'bg-regularText/5 col-span-2 size-8 rounded-full'} />
					<div className={'bg-regularText/5 col-span-4 h-4 w-full rounded-xl'} />
					<div className={'bg-regularText/5 col-span-2 h-4 w-full rounded-xl'} />
				</div>

				<div className={'flex flex-col gap-y-4'}>
					<div className={'flex w-full justify-between'}>
						<p>{'APR'}</p>
						<div className={'bg-regularText/5 w-20 rounded-xl'} />
					</div>
					<div className={'flex w-full justify-between'}>
						<p>{'Total Deposits'}</p>
						<div className={'bg-regularText/5 w-20 rounded-xl'} />
					</div>
					<div className={'flex w-full justify-between'}>
						<p>{'My balance'}</p>
						<div className={'bg-regularText/5 w-20 rounded-xl'} />
					</div>
				</div>
				<div className={'bg-regularText/5 h-10 w-full rounded-xl'} />
			</div>
		</>
	);
}

export function Skeleton(): ReactElement {
	return (
		<div className={'flex flex-col gap-y-3'}>
			{new Array(20).fill(1).map((_, i) => (
				<SkeletonRow key={i} />
			))}
		</div>
	);
}
