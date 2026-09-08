import { numberFormat } from "./utils";

const COMBINED_SELECTOR =
	"#recommended-grid .recommend-card.recommend-card-visible, #recommended-unlocked-grid .unlocked-card.unlocked-card-visible";

function countVisible(selector: string): number {
	return Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(
		(el) => el.style.display !== "none",
	).length;
}

export function updateRecommendedSectionCounts(): void {
	const recommendedCountEl = document.getElementById("recommended-section-count");

	if (recommendedCountEl) {
		const visibleCount = countVisible("#recommended-grid .recommend-card.recommend-card-visible");
		recommendedCountEl.textContent = `${numberFormat(visibleCount)} Recommended`;
	}

	const unlockedCountEl = document.getElementById("recommended-unlocked-section-count");

	if (unlockedCountEl) {
		const visibleCount = countVisible("#recommended-unlocked-grid .unlocked-card.unlocked-card-visible");
		unlockedCountEl.textContent = `${numberFormat(visibleCount)} Unlocked`;
	}
}

export function initRecommendedFilters(): void {
	const searchInput = document.getElementById("recommended-search") as HTMLInputElement;
	const filterSelect = document.getElementById("recommended-filter") as HTMLSelectElement;
	const resetButton = document.getElementById("recommended-reset");

	searchInput.addEventListener("input", function () {
		filterSelect.value = "";

		const search = this.value.toLowerCase();

		document.querySelectorAll<HTMLElement>(COMBINED_SELECTOR).forEach((el) => {
			const searchData = el.getAttribute("data-search-data") ?? "";
			el.style.display = searchData.includes(search) ? "" : "none";
		});

		updateRecommendedSectionCounts();
	});

	filterSelect.addEventListener("change", function () {
		const filter = this.selectedOptions[0]?.getAttribute("data-filter") ?? "";
		const value = this.value;

		document.querySelectorAll<HTMLElement>(COMBINED_SELECTOR).forEach((el) => {
			if (value === "" || filter === "") {
				el.style.display = "";
			} else {
				el.style.display = el.getAttribute(`data-${filter}`) === value ? "" : "none";
			}
		});

		updateRecommendedSectionCounts();
	});

	resetButton?.addEventListener("click", () => {
		searchInput.value = "";
		filterSelect.value = "";

		document.querySelectorAll<HTMLElement>(COMBINED_SELECTOR).forEach((el) => {
			el.style.display = "";
		});

		updateRecommendedSectionCounts();
	});
}
