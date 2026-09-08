import type { Unlock, UnlocksData } from "../types/unlocks";
import type { ItemQualityMap } from "../types/item-quality";
import { computeUnlockMeta, createQualityBadge, createUnlockedCard, buildAchievementPopoverContent } from "./unlocks-table";
import { updateRecommendedSectionCounts } from "./recommended-filters";

// Bootstrap is loaded globally via CDN <script> tag in index.html, not as an npm module.
declare const bootstrap: {
	Popover: new (element: Element, options?: Record<string, unknown>) => unknown;
};

// Item quality (Q0-Q4) only applies to actual collectibles in-game -
// category 21 = Items: Active, 23 = Items: Passive. Trinkets/cards/runes/etc
// are never quality-rated, so they're intentionally excluded from this page.
const ITEM_CATEGORIES = new Set([21, 23]);

interface RecommendedEntry {
	unlock: Unlock;
	quality: number | null;
}

function getItemUnlocks(data: UnlocksData): Unlock[] {
	return data.unlocks.filter((u) => ITEM_CATEGORIES.has(u.category));
}

function injectRecommendedCard(entry: RecommendedEntry, categories: Record<string, string>): void {
	const { unlock, quality } = entry;
	const meta = computeUnlockMeta(unlock, categories);

	const li = document.createElement("li");
	li.classList.add("recommend-card", "recommend-card-visible");
	li.setAttribute("data-id", unlock.name);
	li.setAttribute("data-category-id", String(unlock.category));
	li.setAttribute("data-character", meta.characterName);
	li.setAttribute("data-boss", meta.bossName);
	li.setAttribute("data-search-data", meta.searchData);
	li.tabIndex = 0;

	new bootstrap.Popover(li, {
		trigger: "hover focus",
		placement: "top",
		html: true,
		title: unlock.displayName,
		content: buildAchievementPopoverContent(unlock, meta, { includeUnlockMethod: false }),
		customClass: "unlocked-popover",
	});

	const iconWrap = document.createElement("span");
	iconWrap.classList.add("unlocked-icon-wrap");

	const img = document.createElement("img");
	img.src = unlock.icon;
	img.loading = "lazy";
	img.alt = "";
	img.width = 48;
	img.height = 48;
	iconWrap.appendChild(img);
	iconWrap.appendChild(createQualityBadge(quality, "main"));
	li.appendChild(iconWrap);

	const name = document.createElement("span");
	name.classList.add("recommend-name");
	name.textContent = unlock.displayName;
	li.appendChild(name);

	if (unlock.unlockMethod !== "") {
		const condition = document.createElement("span");
		condition.classList.add("recommend-condition");
		condition.textContent = unlock.unlockMethod;
		li.appendChild(condition);
	}

	document.getElementById("recommended-grid")?.appendChild(li);
}

function populateFilterOptions(optgroupId: string, values: string[], filterAttribute: string): void {
	const optgroup = document.getElementById(optgroupId);

	if (!optgroup) {
		return;
	}

	values.forEach((value) => {
		const option = document.createElement("option");
		option.value = value;
		option.textContent = value;
		option.setAttribute("data-filter", filterAttribute);
		optgroup.appendChild(option);
	});
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

	const itemUnlocks = getItemUnlocks(data);

	const characterNames = [...new Set(itemUnlocks.map((u) => (u.as === false ? null : u.as)).filter((v) => v !== null))];
	const bossNames = [...new Set(itemUnlocks.map((u) => (u.boss === false ? null : u.boss)).filter((v) => v !== null))];
	populateFilterOptions("recommended-character-filter", characterNames.sort(), "character");
	populateFilterOptions("recommended-boss-filter", bossNames.sort(), "boss");

	const recommended: RecommendedEntry[] = itemUnlocks
		.filter((u) => !unlockedIds.has(u.name))
		.map((u) => ({ unlock: u, quality: qualityMap[u.name] ?? null }))
		.sort((a, b) => (b.quality ?? -1) - (a.quality ?? -1));

	recommended.forEach((entry) => injectRecommendedCard(entry, data.categories));

	const unlockedItems = itemUnlocks
		.filter((u) => unlockedIds.has(u.name))
		.sort((a, b) => (qualityMap[b.name] ?? -1) - (qualityMap[a.name] ?? -1));

	unlockedItems.forEach((unlock) => {
		const card = createUnlockedCard(unlock, data.categories, qualityMap);
		// createUnlockedCard's "visible" state is normally toggled reactively by
		// the main page's updateMyProgress(); this page has no such reactive
		// loop, so every card built here is already confirmed unlocked.
		card.classList.add("unlocked-card-visible");
		document.getElementById("recommended-unlocked-grid")?.appendChild(card);
	});

	document.getElementById("recommended-section")?.classList.toggle("d-none", recommended.length === 0);
	document.getElementById("recommended-unlocked-section")?.classList.toggle("d-none", unlockedItems.length === 0);

	updateRecommendedSectionCounts();

	document.getElementById("recommended-content")?.classList.remove("d-none");
}
