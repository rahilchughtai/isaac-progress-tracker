import unlocksData from "./data/unlocks.json";
import type { UnlocksData } from "./types/unlocks";
import { ingestUnlocksData } from "./modules/unlocks-table";
import { initFilters } from "./modules/filters";
import { loadStoredProgress, setUnlockedIds, updateMyProgress } from "./modules/progress";
import { initSaveFileModal } from "./modules/save-file-modal";

const data = unlocksData as UnlocksData;

initFilters();
ingestUnlocksData(data);

const stored = loadStoredProgress();

if (stored) {
	setUnlockedIds(new Set(stored.unlockedIds));
	updateMyProgress();
}

initSaveFileModal();
