import type {NextApiRequest, NextApiResponse} from 'next';
import type {TAngleRewardsResponse} from '../../../hooks/useAngleRewards';

const MERKL_API_BASE_URL = 'https://api.merkl.xyz';
const SUPPORTED_CHAIN_IDS = new Set(['137', '747474']);

type TMerklRewardsApiResponse = TAngleRewardsResponse | {error: string};

const getQueryParam = (value: string | string[] | undefined): string | undefined => {
	return typeof value === 'string' ? value : undefined;
};

const getMerklErrorMessage = async (response: Response): Promise<string> => {
	try {
		const responseBody = (await response.json()) as {error?: string; message?: string};
		return responseBody.error ?? responseBody.message ?? response.statusText;
	} catch {
		return response.statusText;
	}
};

export default async function merklRewards(
	req: NextApiRequest,
	res: NextApiResponse<TMerklRewardsApiResponse>
): Promise<void> {
	if (req.method !== 'GET') {
		res.setHeader('Allow', 'GET');
		res.status(405).json({error: 'Method not allowed'});
		return;
	}

	const address = getQueryParam(req.query.address);
	const chainId = getQueryParam(req.query.chainId);

	if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
		res.status(400).json({error: 'Invalid address'});
		return;
	}

	if (!chainId || !SUPPORTED_CHAIN_IDS.has(chainId)) {
		res.status(400).json({error: 'Invalid chainId'});
		return;
	}

	const merklApiKey = process.env.MERKL_API_KEY?.trim();

	if (!merklApiKey) {
		res.status(500).json({error: 'MERKL_API_KEY environment variable is not set'});
		return;
	}

	const merklUrl = new URL(`/v4/users/${address}/rewards`, MERKL_API_BASE_URL);
	merklUrl.searchParams.set('chainId', chainId);

	const response = await fetch(merklUrl, {
		headers: {
			Accept: 'application/json',
			'X-API-Key': merklApiKey
		}
	});

	res.setHeader('Cache-Control', 'private, no-store');

	if (!response.ok) {
		const errorMessage = await getMerklErrorMessage(response);
		res.status(response.status).json({error: errorMessage || 'Failed to fetch Merkl rewards'});
		return;
	}

	const rewards = (await response.json()) as TAngleRewardsResponse;
	res.status(200).json(rewards);
}
