import { numberFormat } from "./utils";

export function updateUnlockedSectionCount(): void {
	const countEl = document.getElementById("unlocked-section-count");

	if (!countEl) {
		return;
	}

	const cards = document.querySelectorAll<HTMLElement>("#unlocked-grid .unlocked-card.unlocked-card-visible");
	const visibleCount = Array.from(cards).filter((card) => card.style.display !== "none").length;

	countEl.textContent = `${numberFormat(visibleCount)} Unlocked`;
}

function updateCountedFilter(optgroupId: string, attribute: string): void {
	const counts: Record<string, number> = {};

	document.querySelectorAll<HTMLTableRowElement>("#unlocks_table tbody tr.unlock-incomplete").forEach((row) => {
		const value = row.getAttribute(attribute) ?? "";
		counts[value] = (counts[value] ?? 0) + 1;
	});

	document.getElementById(optgroupId)?.querySelectorAll("option").forEach((option) => {
		const value = option.value;

		if (value === "") {
			return;
		}

		const baseText = option.textContent?.replace(/\s*\([0-9]+\)$/, "") ?? "";
		option.textContent = counts[value] !== undefined ? `${baseText} (${counts[value]})` : baseText;
	});
}

function sanitizeFilterOptions(): void {
	document.querySelectorAll("#table-manager select").forEach((select) => {
		if (!select.id.endsWith("-filter")) {
			return;
		}

		select.querySelectorAll("option").forEach((option) => {
			const text = option.textContent ?? "";

			if (/\([0-9]+\)$/.test(text) || /^All /.test(text)) {
				return;
			}

			(option as HTMLOptionElement).style.display = "none";
		});
	});
}

export function updateFilters(): void {
	updateCountedFilter("category-filter", "data-category-id");
	updateCountedFilter("character-filter", "data-character");
	updateCountedFilter("boss-filter", "data-boss");
	sanitizeFilterOptions();
}

// Shared across every sort field - a single toggle flips the direction of
// whichever field is currently selected, rather than each field remembering
// its own direction. Descending by default, matching the app's original
// "highest percentage first" default appearance.
let sortDescending = true;

function updateSortDirectionToggle(): void {
	const icon = document.getElementById("sort-direction-icon");
	const button = document.getElementById("sort-direction-toggle");

	if (icon) {
		icon.textContent = sortDescending ? "↓" : "↑";
	}

	if (button) {
		const label = sortDescending
			? "Sort descending, click to sort ascending"
			: "Sort ascending, click to sort descending";
		button.title = sortDescending ? "Sort descending" : "Sort ascending";
		button.setAttribute("aria-label", label);
	}
}

function applySort(sort: string): void {
	const tbody = document.querySelector("#unlocks_table tbody");
	if (!tbody) {
		return;
	}

	const rows = Array.from(tbody.querySelectorAll<HTMLTableRowElement>("tr.unlock-incomplete"));
	const direction = sortDescending ? -1 : 1;

	rows.sort((a, b) => {
		if (sort === "percentage") {
			return direction * (Number(a.getAttribute("data-percentage")) - Number(b.getAttribute("data-percentage")));
		}

		const attribute = `data-${sort}`;
		const aContent = a.getAttribute(attribute) ?? "";
		const bContent = b.getAttribute(attribute) ?? "";

		// entries with no value for this field always sort last, in either direction
		if (aContent === bContent) {
			return 0;
		} else if (aContent === "") {
			return 1;
		} else if (bContent === "") {
			return -1;
		}

		return direction * aContent.localeCompare(bContent);
	});

	rows.forEach((row) => tbody.appendChild(row));
}

export function initFilters(): void {
	const searchInput = document.getElementById("table-search") as HTMLInputElement;
	const filterSelect = document.getElementById("table-filter") as HTMLSelectElement;
	const sortSelect = document.getElementById("table-sort") as HTMLSelectElement;
	const sortDirectionButton = document.getElementById("sort-direction-toggle");
	const resetButton = document.getElementById("filters-reset");

	searchInput.addEventListener("input", function () {
		filterSelect.value = "";

		const search = this.value.toLowerCase();

		document
			.querySelectorAll<HTMLElement>("#unlocks_table tbody tr.unlock-incomplete, #unlocked-grid .unlocked-card.unlocked-card-visible")
			.forEach((row) => {
				const searchData = row.getAttribute("data-search-data") ?? "";
				row.style.display = searchData.includes(search) ? "" : "none";
			});

		updateUnlockedSectionCount();
	});

	filterSelect.addEventListener("change", function () {
		const filter = this.selectedOptions[0]?.getAttribute("data-filter") ?? "";
		const value = this.value;

		document
			.querySelectorAll<HTMLElement>("#unlocks_table tbody tr.unlock-incomplete, #unlocked-grid .unlocked-card.unlocked-card-visible")
			.forEach((row) => {
				if (value === "" || filter === "") {
					row.style.display = "";
				} else {
					row.style.display = row.getAttribute(`data-${filter}`) === value ? "" : "none";
				}
			});

		(document.getElementById("character-filter") as HTMLSelectElement).value = "";
		(document.getElementById("boss-filter") as HTMLSelectElement).value = "";

		updateUnlockedSectionCount();
	});

	sortSelect.addEventListener("change", function () {
		applySort(this.value);
	});

	sortDirectionButton?.addEventListener("click", () => {
		sortDescending = !sortDescending;
		updateSortDirectionToggle();
		applySort(sortSelect.value);
	});

	resetButton?.addEventListener("click", () => {
		searchInput.value = "";
		filterSelect.value = "";
		sortSelect.value = "percentage";
		sortDescending = true;
		updateSortDirectionToggle();

		document
			.querySelectorAll<HTMLElement>("#unlocks_table tbody tr.unlock-incomplete, #unlocked-grid .unlocked-card.unlocked-card-visible")
			.forEach((row) => {
				row.style.display = "";
			});

		updateUnlockedSectionCount();
		sortSelect.dispatchEvent(new Event("change"));
	});
}

export function sortByCurrentSelection(): void {
	document.getElementById("table-sort")?.dispatchEvent(new Event("change"));
}
