export type TTab = {label: string; value: 'all' | 'v2' | 'v3' | 'others'};

export type TVaultType = 'v2' | 'v3' | 'others';

export type TPartner = {
	name: string;
	description: string;
	icon: string;
	vaultType: TVaultType;
};
