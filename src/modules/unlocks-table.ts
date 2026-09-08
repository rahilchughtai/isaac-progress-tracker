import type { Unlock, UnlocksData } from "../types/unlocks";
import type { ItemQualityMap } from "../types/item-quality";
import { updateMyProgress } from "./progress";
import { updateFilters, sortByCurrentSelection } from "./filters";

// Bootstrap is loaded globally via CDN <script> tag in index.html, not as an npm module.
declare const bootstrap: {
	Popover: new (element: Element, options?: Record<string, unknown>) => unknown;
};

export interface UnlockMeta {
	categoryName: string;
	characterName: string;
	bossName: string;
	searchData: string;
}

export function computeUnlockMeta(unlock: Unlock, categories: Record<string, string>): UnlockMeta {
	const categoryName = unlock.category in categories ? categories[unlock.category] : "";
	const characterName = unlock.as === false ? "" : unlock.as;
	const bossName = unlock.boss === false ? "" : unlock.boss;

	const searchData = [unlock.name, unlock.displayName, unlock.description, unlock.unlockMethod, characterName, bossName]
		.join(" ")
		.toLowerCase()
		.trim();

	return { categoryName, characterName, bossName, searchData };
}

// Small corner badge shown on an item's icon when its in-game quality (Q0-Q4)
// is known. "main" is used where the icon has no other overlay; "alt" is used
// on the trophy case, where the unlocked checkmark already occupies the
// bottom-right corner.
function createQualityBadge(quality: number, variant: "main" | "alt"): HTMLSpanElement {
	const badge = document.createElement("span");
	badge.classList.add(
		"quality-badge",
		"quality-badge-overlay",
		variant === "alt" ? "quality-badge-overlay-alt" : "quality-badge-overlay-main",
		`quality-badge-${quality}`,
	);
	badge.setAttribute("aria-hidden", "true");
	badge.textContent = `Q${quality}`;
	return badge;
}

function textCell(text: string, classNames: string[] = []): HTMLTableCellElement {
	const cell = document.createElement("td");
	cell.classList.add(...classNames);
	cell.textContent = text;
	return cell;
}

function emptyCell(classNames: string[]): HTMLTableCellElement {
	const cell = document.createElement("td");
	cell.classList.add(...classNames);

	const span = document.createElement("span");
	span.classList.add("text-muted", "small", "fst-italic");
	span.innerHTML = "&mdash;";
	cell.appendChild(span);

	return cell;
}

function injectUnlockTableRow(unlock: Unlock, categories: Record<string, string>, qualityMap: ItemQualityMap): void {
	const row = document.createElement("tr");
	const { categoryName, characterName, bossName, searchData } = computeUnlockMeta(unlock, categories);

	row.classList.add("unlock-incomplete");
	row.setAttribute("data-id", unlock.name);
	row.setAttribute("data-name", unlock.displayName);
	row.setAttribute("data-category", categoryName);
	row.setAttribute("data-category-id", String(unlock.category));
	row.setAttribute("data-character", characterName);
	row.setAttribute("data-boss", bossName);
	row.setAttribute("data-percentage", String(unlock.percentage));
	row.setAttribute("data-search-data", searchData);

	// icon
	let cell = document.createElement("td");
	let link = document.createElement("a");
	link.href = `https://bindingofisaacrebirth.fandom.com/wiki/${unlock.link}`;
	link.target = "_blank";
	link.rel = "noopener noreferrer nofollow";

	const img = document.createElement("img");
	img.src = unlock.icon;
	img.loading = "lazy";
	img.alt = unlock.displayName;
	img.width = 64;
	img.height = 64;

	link.classList.add("icon-badge-wrap");
	link.appendChild(img);

	const quality = qualityMap[unlock.name];
	if (quality !== undefined) {
		link.appendChild(createQualityBadge(quality, "main"));
	}

	cell.appendChild(link);

	const mobilePercentage = document.createElement("div");
	mobilePercentage.classList.add("small", "text-center", "text-muted", "d-block", "d-md-none", "pt-1");
	mobilePercentage.textContent = `${unlock.percentage.toFixed(0)}%`;
	cell.appendChild(mobilePercentage);

	row.appendChild(cell);

	// unlock name/description
	cell = document.createElement("td");
	link = document.createElement("a");
	link.href = `https://bindingofisaacrebirth.fandom.com/wiki/${unlock.link}`;
	link.target = "_blank";
	link.rel = "noopener noreferrer nofollow";

	const strong = document.createElement("strong");
	strong.title = unlock.name;
	strong.textContent = unlock.displayName;
	link.appendChild(strong);
	cell.appendChild(link);

	if (unlock.description !== "") {
		const description = document.createElement("em");
		description.classList.add("small", "text-muted", "d-block", "d-md-inline-block", "ps-md-2", "mb-2", "mb-md-0");
		description.textContent = unlock.description;
		cell.appendChild(description);
	}

	if (unlock.unlockMethod !== "") {
		const method = document.createElement("p");
		method.classList.add("small", "py-0", "my-0");
		method.textContent = unlock.unlockMethod;
		cell.appendChild(method);
	}

	if (unlock.as !== false) {
		const div = document.createElement("div");
		div.classList.add("small", "d-block", "d-md-none", "pt-2");
		const label = document.createElement("strong");
		label.textContent = "Character:";
		div.appendChild(label);
		div.appendChild(document.createTextNode(` ${unlock.as}`));
		cell.appendChild(div);
	}

	if (unlock.boss !== false) {
		const div = document.createElement("div");
		div.classList.add("small", "d-block", "d-md-none", "pt-2");
		const label = document.createElement("strong");
		label.textContent = "Boss:";
		div.appendChild(label);
		div.appendChild(document.createTextNode(` ${unlock.boss}`));
		cell.appendChild(div);
	}

	if (unlock.category in categories) {
		const div = document.createElement("div");
		div.classList.add("small", "d-block", "d-md-none", "pt-2");
		const label = document.createElement("strong");
		label.textContent = "Category:";
		div.appendChild(label);
		div.appendChild(document.createTextNode(` ${categories[unlock.category]}`));
		cell.appendChild(div);
	}

	row.appendChild(cell);

	// character
	row.appendChild(
		unlock.as !== false
			? textCell(unlock.as, ["text-center", "d-none", "d-md-table-cell"])
			: emptyCell(["text-center", "d-none", "d-md-table-cell"]),
	);

	// boss
	row.appendChild(
		unlock.boss !== false
			? textCell(unlock.boss, ["text-center", "d-none", "d-md-table-cell"])
			: emptyCell(["text-center", "d-none", "d-md-table-cell"]),
	);

	// category
	row.appendChild(
		unlock.category in categories
			? textCell(categories[unlock.category], ["d-none", "d-md-table-cell"])
			: emptyCell(["d-none", "d-md-table-cell"]),
	);

	// percentage
	cell = document.createElement("td");
	cell.classList.add("text-center", "d-none", "d-md-table-cell");
	cell.setAttribute("data-sort", String(unlock.percentage));
	cell.textContent = `${unlock.percentage.toFixed(0)}%`;
	row.appendChild(cell);

	document.querySelector("#unlocks_table tbody")?.appendChild(row);
}

function buildUnlockedPopoverContent(unlock: Unlock, meta: UnlockMeta): HTMLElement {
	const wrapper = document.createElement("div");
	wrapper.classList.add("unlocked-popover-content");

	if (unlock.description !== "") {
		const description = document.createElement("p");
		description.classList.add("mb-1", "fst-italic");
		description.textContent = unlock.description;
		wrapper.appendChild(description);
	}

	if (unlock.unlockMethod !== "") {
		const method = document.createElement("p");
		method.classList.add("mb-1");
		method.textContent = unlock.unlockMethod;
		wrapper.appendChild(method);
	}

	const details: string[] = [];

	if (meta.characterName !== "") {
		details.push(`Character: ${meta.characterName}`);
	}

	if (meta.bossName !== "") {
		details.push(`Boss: ${meta.bossName}`);
	}

	if (meta.categoryName !== "") {
		details.push(`Category: ${meta.categoryName}`);
	}

	details.push(`Unlocked by ${unlock.percentage.toFixed(1)}% of players`);

	details.forEach((line) => {
		const p = document.createElement("p");
		p.classList.add("mb-0", "small", "text-muted");
		p.textContent = line;
		wrapper.appendChild(p);
	});

	return wrapper;
}

export function createUnlockedCard(
	unlock: Unlock,
	categories: Record<string, string>,
	qualityMap: ItemQualityMap,
): HTMLLIElement {
	const meta = computeUnlockMeta(unlock, categories);

	const li = document.createElement("li");
	li.classList.add("unlocked-card");
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
		content: buildUnlockedPopoverContent(unlock, meta),
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

	const badge = document.createElement("span");
	badge.classList.add("unlocked-badge");
	badge.setAttribute("aria-hidden", "true");
	badge.textContent = "✓";
	iconWrap.appendChild(badge);

	const quality = qualityMap[unlock.name];
	if (quality !== undefined) {
		iconWrap.appendChild(createQualityBadge(quality, "alt"));
	}

	li.appendChild(iconWrap);

	const name = document.createElement("span");
	name.classList.add("unlocked-name");
	name.textContent = unlock.displayName;
	li.appendChild(name);

	return li;
}

function injectUnlockedCard(unlock: Unlock, categories: Record<string, string>, qualityMap: ItemQualityMap): void {
	const li = createUnlockedCard(unlock, categories, qualityMap);
	document.querySelector("#unlocked-grid")?.appendChild(li);
}

function populateFilterOptions(
	optgroupId: string,
	values: string[],
	filterAttribute: string,
): void {
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

export function ingestUnlocksData(data: UnlocksData, qualityMap: ItemQualityMap): void {
	const sortedCategories = Object.entries(data.categories)
		.map(([id, name]) => ({ id, name }))
		.sort((a, b) => a.name.localeCompare(b.name));

	populateFilterOptions(
		"category-filter",
		sortedCategories.map((c) => c.id),
		"category-id",
	);
	// category options need their visible text to be the name, not the id
	document.getElementById("category-filter")?.querySelectorAll("option").forEach((option) => {
		const category = sortedCategories.find((c) => c.id === option.getAttribute("value"));
		if (category) {
			option.textContent = category.name;
		}
	});

	if (data.character_names?.length > 0) {
		populateFilterOptions("character-filter", data.character_names, "character");
	}

	if (data.boss_names?.length > 0) {
		populateFilterOptions("boss-filter", data.boss_names, "boss");
	}

	data.unlocks.forEach((unlock) => injectUnlockTableRow(unlock, data.categories, qualityMap));
	data.unlocks.forEach((unlock) => injectUnlockedCard(unlock, data.categories, qualityMap));

	updateMyProgress();
	updateFilters();
	sortByCurrentSelection();

	document.getElementById("unlocks_table_container")?.classList.remove("d-none");
	document.getElementById("unlocks_table_progress")?.classList.add("d-none");
}
