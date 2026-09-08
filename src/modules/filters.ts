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

function applySort(sort: string): void {
	const tbody = document.querySelector("#unlocks_table tbody");
	if (!tbody) {
		return;
	}

	const rows = Array.from(tbody.querySelectorAll<HTMLTableRowElement>("tr.unlock-incomplete"));

	rows.sort((a, b) => {
		if (sort === "percentage") {
			return Number(b.getAttribute("data-percentage")) - Number(a.getAttribute("data-percentage"));
		}

		const attribute = `data-${sort}`;
		const aContent = a.getAttribute(attribute) ?? "";
		const bContent = b.getAttribute(attribute) ?? "";

		if (aContent === bContent) {
			return 0;
		} else if (!aContent && bContent) {
			return 1;
		} else if (aContent && !bContent) {
			return -1;
		}

		return aContent.localeCompare(bContent);
	});

	rows.forEach((row) => tbody.appendChild(row));
}

export function initFilters(): void {
	const searchInput = document.getElementById("table-search") as HTMLInputElement;
	const filterSelect = document.getElementById("table-filter") as HTMLSelectElement;
	const sortSelect = document.getElementById("table-sort") as HTMLSelectElement;
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

	resetButton?.addEventListener("click", () => {
		searchInput.value = "";
		filterSelect.value = "";
		sortSelect.value = "percentage";

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
