import { numberFormat } from "./utils";
import { updateFilters, updateSectionCounts } from "./filters";

const STORAGE_KEY_PROGRESS = "my-progress";

export interface StoredProgress {
	unlockedIds: string[];
	savedAt: string;
}

let unlockedIds = new Set<string>();

export function loadStoredProgress(): StoredProgress | null {
	if (typeof localStorage === "undefined") {
		return null;
	}

	const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);

	if (!raw) {
		return null;
	}

	try {
		return JSON.parse(raw) as StoredProgress;
	} catch {
		return null;
	}
}

export function setUnlockedIds(ids: Set<string>): void {
	unlockedIds = ids;
}

export function saveProgress(ids: Set<string>): void {
	unlockedIds = ids;

	if (typeof localStorage === "undefined") {
		return;
	}

	const progress: StoredProgress = {
		unlockedIds: [...ids],
		savedAt: new Date().toISOString(),
	};

	localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
}

export function clearProgress(): void {
	unlockedIds = new Set();

	if (typeof localStorage !== "undefined") {
		localStorage.removeItem(STORAGE_KEY_PROGRESS);
	}

	updateMyProgress();
}

export function updateMyProgress(): void {
	let numUnlocks = 0;
	let numUnlocked = 0;
	let numRemaining = 0;

	document.querySelectorAll<HTMLTableRowElement>("#unlocks_table tbody tr").forEach((row) => {
		const id = row.getAttribute("data-id") ?? "";

		numUnlocks++;

		if (unlockedIds.has(id)) {
			row.style.display = "none";
			row.classList.remove("unlock-incomplete");
			row.classList.add("unlock-complete");

			numUnlocked++;
		} else {
			row.style.display = "";
			row.classList.remove("unlock-complete");
			row.classList.add("unlock-incomplete");

			numRemaining++;
		}
	});

	document.querySelectorAll<HTMLLIElement>("#unlocked-grid .unlocked-card").forEach((card) => {
		const id = card.getAttribute("data-id") ?? "";

		// Reset any inline display left over from a previous search/filter
		// application - only cards carrying "unlocked-card-visible" are ever
		// eligible to be shown, so locked achievements can never leak through
		// a stale or newly-applied filter.
		card.style.display = "";
		card.classList.toggle("unlocked-card-visible", unlockedIds.has(id));
	});

	// Both loops above just reset every row/card's inline display based purely
	// on lock status (no filter applied yet), so this also reflects the
	// correct un-filtered totals for both sections at this point.
	updateSectionCounts();

	document.getElementById("remaining-section")?.classList.toggle("d-none", numRemaining === 0);
	document.getElementById("unlocked-section")?.classList.toggle("d-none", numUnlocked === 0);

	let progressText = "";

	if (numUnlocked > 0) {
		progressText += `${numberFormat(numUnlocked)}/${numberFormat(numUnlocks)} - `;
	}

	progressText += `${numRemaining} remaining (${numberFormat((numUnlocked / numUnlocks) * 100, 1)}% unlocked)`;

	document.querySelectorAll(".unlock_progress_text").forEach((el) => {
		el.textContent = progressText;
	});

	updateFilters();
}
