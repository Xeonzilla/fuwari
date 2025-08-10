import { type CollectionEntry, getCollection } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryUrl } from "@utils/url-utils.ts";

// Retrieve posts and sort them by publication date
async function getRawSortedPosts() {
	const allBlogPosts = await getCollection("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const sorted = allBlogPosts.sort((a, b) => {
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});
	return sorted;
}

export async function getSortedPosts() {
	const sorted = await getRawSortedPosts();

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = sorted[i - 1].slug;
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = sorted[i + 1].slug;
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}

	return sorted;
}
export type PostForList = {
	slug: string;
	data: CollectionEntry<"posts">["data"];
};
export async function getSortedPostsList(): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts();

	// delete post.body
	const sortedPostsList = sortedFullPosts.map((post) => ({
		slug: post.slug,
		data: post.data,
	}));

	return sortedPostsList;
}
export type Tag = {
	name: string;
	count: number;
};

export async function getTagList(): Promise<Tag[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const countMap: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { tags: string[] } }) => {
		post.data.tags.forEach((tag: string) => {
			if (!countMap[tag]) countMap[tag] = 0;
			countMap[tag]++;
		});
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
	name: string;
	count: number;
	url: string;
};

export interface CategoryNode {
	name: string;
	count: number;
	url: string;
	fullPath: string;
	children: CategoryNode[];
}

export async function getCategoryList(): Promise<Category[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});
	const count: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { category: string | null } }) => {
		if (!post.data.category) {
			const ucKey = i18n(I18nKey.uncategorized);
			count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
			return;
		}

		const categoryName =
			typeof post.data.category === "string"
				? post.data.category.trim()
				: String(post.data.category).trim();

		count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
	});

	const lst = Object.keys(count).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	const ret: Category[] = [];
	for (const c of lst) {
		ret.push({
			name: c,
			count: count[c],
			url: getCategoryUrl(c),
		});
	}
	return ret;
}

export async function getNestedCategoryList(): Promise<CategoryNode[]> {
	const categories = await getCategoryList();
	return buildCategoryTree(categories);
}

function buildCategoryTree(categories: Category[]): CategoryNode[] {
	const root: CategoryNode[] = [];
	const map: { [key: string]: CategoryNode } = {};

	categories.forEach((category) => {
		const parts = category.name.split("/");
		let currentPath = "";

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i].trim();
			currentPath = currentPath ? `${currentPath}/${part}` : part;

			if (!map[currentPath]) {
				const node: CategoryNode = {
					name: part,
					count: 0,
					url: getCategoryUrl(currentPath),
					fullPath: currentPath,
					children: [],
				};
				map[currentPath] = node;

				if (i === 0) {
					root.push(node);
				}
			}

			if (i === parts.length - 1) {
				map[currentPath].count = category.count;
			}
		}
	});

	Object.keys(map).forEach((path) => {
		const node = map[path];
		const parts = path.split("/");

		if (parts.length > 1) {
			const parentPath = parts.slice(0, -1).join("/");
			const parent = map[parentPath];
			if (parent && !parent.children.find((child) => child.fullPath === path)) {
				parent.children.push(node);
			}
		}
	});

	function calculateTotalCount(node: CategoryNode): number {
		let total = node.count;

		for (const child of node.children) {
			total += calculateTotalCount(child);
		}

		node.count = total;
		return total;
	}

	root.forEach(calculateTotalCount);

	return root;
}
