const BANGUMI_USER_ID = "Xeonzilla";
const BANGUMI_API_BASE = "https://api.bgm.tv";

export interface ProcessedAnime {
	title: string;
	cover: string;
	originalTitle: string;
	year: string;
	genre: string[];
	progress: number;
	totalEpisodes: number;
}

interface BangumiSubject {
	date: string;
	eps: number;
	name_cn: string;
	name: string;
	images: { medium: string };
	tags: { name: string }[];
}

interface BangumiCollectionItem {
	subject: BangumiSubject;
	ep_status: number;
}

async function fetchCollectionCount(type: number): Promise<number> {
	try {
		const response = await fetch(
			`${BANGUMI_API_BASE}/v0/users/${BANGUMI_USER_ID}/collections?subject_type=2&type=${type}&limit=1&offset=0`,
		);
		if (!response.ok) {
			throw new Error(
				`Failed to fetch Bangumi count. Status: ${response.status} ${response.statusText}`,
			);
		}

		const data: { total: number; data: unknown[] } = await response.json();
		return data.total || 0;
	} catch (error) {
		console.error(`Error fetching Bangumi count for type ${type}:`, error);
		throw error;
	}
}

async function fetchWatchingCollection(): Promise<BangumiCollectionItem[]> {
	try {
		const allData: BangumiCollectionItem[] = [];
		let offset = 0;
		const limit = 50;
		let hasMore = true;
		while (hasMore) {
			const response = await fetch(
				`${BANGUMI_API_BASE}/v0/users/${BANGUMI_USER_ID}/collections?subject_type=2&type=3&limit=${limit}&offset=${offset}`,
			);
			if (!response.ok) {
				throw new Error(
					`Failed to fetch Bangumi data. Status: ${response.status} ${response.statusText}`,
				);
			}

			const data: { data: BangumiCollectionItem[] } = await response.json();
			if (data.data?.length > 0) {
				allData.push(...data.data);
			}
			if (!data.data || data.data.length < limit) {
				hasMore = false;
			} else {
				offset += limit;
			}
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		return allData;
	} catch (error) {
		console.error("Error fetching Bangumi data:", error);
		let errorMessage = "An unknown error occurred";
		if (error instanceof Error) {
			errorMessage = error.message;
		}
		throw new Error(
			`Could not fetch Bangumi "watching" collection. Original error: ${errorMessage}`,
		);
	}
}

function processBangumiData(data: BangumiCollectionItem[]): ProcessedAnime[] {
	if (!data) return [];
	const containsNumberRegex = /\d/;
	return data.map((item) => {
		const progress = item.ep_status || 0;
		const totalEpisodes = item.subject.eps || progress;
		const genre = item.subject.tags
			? item.subject.tags
					.filter((tag) => !containsNumberRegex.test(tag.name))
					.slice(0, 2)
					.map((tag) => tag.name)
			: [];

		return {
			title: item.subject.name_cn,
			cover: item.subject.images.medium,
			originalTitle: item.subject.name,
			year: item.subject.date,
			genre: genre,
			progress: progress,
			totalEpisodes: totalEpisodes,
		};
	});
}

export async function getAnimeData() {
	const [watchingData, completedCount] = await Promise.all([
		fetchWatchingCollection(),
		fetchCollectionCount(2),
	]);

	const animeList = processBangumiData(watchingData);

	const watchingCount = watchingData.length;
	const totalCount = watchingCount + completedCount;

	const stats = {
		total: totalCount,
		watching: watchingCount,
		completed: completedCount,
	};

	return { stats, animeList };
}
