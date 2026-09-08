import type { Unlock, UnlocksData } from "../types/unlocks";
import type { ItemQualityMap } from "../types/item-quality";

// Item quality (Q0-Q4) only applies to actual collectibles in-game -
// category 21 = Items: Active, 23 = Items: Passive. Trinkets/cards/runes/etc
// are never quality-rated, so they're intentionally excluded from this page.
const ITEM_CATEGORIES = new Set([21, 23]);

const BATCH_SIZE = 20;

interface RecommendedEntry {
	unlock: Unlock;
	quality: number | null;
}

function getRecommendedItemUnlocks(
	data: UnlocksData,
	qualityMap: ItemQualityMap,
	unlockedIds: Set<string>,
): RecommendedEntry[] {
	return data.unlocks
		.filter((u) => ITEM_CATEGORIES.has(u.category) && !unlockedIds.has(u.name))
		.map((u) => ({ unlock: u, quality: qualityMap[u.name] ?? null }))
		.sort((a, b) => (b.quality ?? -1) - (a.quality ?? -1));
}

function injectRecommendedCard(entry: RecommendedEntry): void {
	const { unlock, quality } = entry;

	const li = document.createElement("li");
	li.classList.add("recommend-card");

	const link = document.createElement("a");
	link.href = `https://bindingofisaacrebirth.fandom.com/wiki/${unlock.link}`;
	link.target = "_blank";
	link.rel = "noopener noreferrer nofollow";
	link.classList.add("recommend-icon-link");

	const img = document.createElement("img");
	img.src = unlock.icon;
	img.loading = "lazy";
	img.alt = "";
	img.width = 64;
	img.height = 64;
	link.appendChild(img);
	li.appendChild(link);

	const body = document.createElement("div");
	body.classList.add("recommend-body");

	const titleRow = document.createElement("div");
	titleRow.classList.add("recommend-title-row");

	const titleLink = document.createElement("a");
	titleLink.href = `https://bindingofisaacrebirth.fandom.com/wiki/${unlock.link}`;
	titleLink.target = "_blank";
	titleLink.rel = "noopener noreferrer nofollow";

	const strong = document.createElement("strong");
	strong.textContent = unlock.displayName;
	titleLink.appendChild(strong);
	titleRow.appendChild(titleLink);

	const badge = document.createElement("span");
	badge.classList.add("quality-badge", `quality-badge-${quality ?? "unknown"}`);
	badge.textContent = quality === null ? "Q?" : `Q${quality}`;
	titleRow.appendChild(badge);

	body.appendChild(titleRow);

	if (unlock.unlockMethod !== "") {
		const method = document.createElement("p");
		method.classList.add("small", "text-muted", "mb-0");
		method.textContent = unlock.unlockMethod;
		body.appendChild(method);
	}

	li.appendChild(body);

	document.getElementById("recommended-grid")?.appendChild(li);
}

export function renderRecommendedUnlocks(
	data: UnlocksData,
	qualityMap: ItemQualityMap,
	unlockedIds: Set<string> | null,
): void {
	document.getElementById("recommended-loading")?.classList.add("d-none");

	if (unlockedIds === null) {
		document.getElementById("recommended-empty-no-save")?.classList.remove("d-none");
		return;
	}

	const entries = getRecommendedItemUnlocks(data, qualityMap, unlockedIds);

	if (entries.length === 0) {
		document.getElementById("recommended-empty-all-unlocked")?.classList.remove("d-none");
		return;
	}

	let shown = 0;
	const showMoreButton = document.getElementById("recommended-show-more");
	const showMoreContainer = document.getElementById("recommended-show-more-container");

	function showNextBatch(): void {
		const nextBatch = entries.slice(shown, shown + BATCH_SIZE);
		nextBatch.forEach(injectRecommendedCard);
		shown += nextBatch.length;

		showMoreContainer?.classList.toggle("d-none", shown >= entries.length);
	}

	showMoreButton?.addEventListener("click", showNextBatch);

	showNextBatch();
	document.getElementById("recommended-grid-container")?.classList.remove("d-none");
}
