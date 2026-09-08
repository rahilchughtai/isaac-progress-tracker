import type { Unlock, UnlocksData } from "../types/unlocks";
import { updateMyProgress } from "./progress";
import { updateFilters, sortByCurrentSelection } from "./filters";

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

function injectUnlockTableRow(unlock: Unlock, categories: Record<string, string>): void {
	const row = document.createElement("tr");

	const categoryName = unlock.category in categories ? categories[unlock.category] : "";
	const characterName = unlock.as === false ? "" : unlock.as;
	const bossName = unlock.boss === false ? "" : unlock.boss;

	const searchData = [unlock.name, unlock.displayName, unlock.description, unlock.unlockMethod, characterName, bossName]
		.join(" ")
		.toLowerCase()
		.trim();

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

	link.appendChild(img);
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

function injectUnlockedCard(unlock: Unlock): void {
	const li = document.createElement("li");
	li.classList.add("unlocked-card");
	li.setAttribute("data-id", unlock.name);

	const tooltip = unlock.description || unlock.unlockMethod;
	if (tooltip) {
		li.title = tooltip;
	}

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

	li.appendChild(iconWrap);

	const name = document.createElement("span");
	name.classList.add("unlocked-name");
	name.textContent = unlock.displayName;
	li.appendChild(name);

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

export function ingestUnlocksData(data: UnlocksData): void {
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

	data.unlocks.forEach((unlock) => injectUnlockTableRow(unlock, data.categories));
	data.unlocks.forEach((unlock) => injectUnlockedCard(unlock));

	updateMyProgress();
	updateFilters();
	sortByCurrentSelection();

	document.getElementById("unlocks_table_container")?.classList.remove("d-none");
	document.getElementById("unlocks_table_progress")?.classList.add("d-none");
}
