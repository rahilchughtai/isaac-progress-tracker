import { numberFormat } from "./utils";
import { updateFilters } from "./filters";

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

	let progressText = "";

	if (numUnlocked > 0) {
		progressText += `${numberFormat(numUnlocked)}/${numberFormat(numUnlocks)} - `;
	}

	progressText += `${numRemaining} remaining (${numberFormat(((numUnlocks - numUnlocked) / numUnlocks) * 100, 1)}%)`;

	document.querySelectorAll(".unlock_progress_text").forEach((el) => {
		el.textContent = progressText;
	});

	updateFilters();
}
