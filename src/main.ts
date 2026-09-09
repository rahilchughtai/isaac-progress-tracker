import unlocksData from "./data/unlocks.json";
import itemQuality from "./data/item-quality.json";
import type { UnlocksData } from "./types/unlocks";
import type { ItemQualityMap } from "./types/item-quality";
import { ingestUnlocksData } from "./modules/unlocks-table";
import { initFilters } from "./modules/filters";
import { loadStoredProgress, setUnlockedIds, updateMyProgress } from "./modules/progress";
import { initSaveFileModal } from "./modules/save-file-modal";
import { initHibaMode } from "./modules/hiba-mode";

const data = unlocksData as UnlocksData;
const qualityMap = itemQuality as ItemQualityMap;

initHibaMode();
initFilters();
ingestUnlocksData(data, qualityMap);

const stored = loadStoredProgress();

if (stored) {
	setUnlockedIds(new Set(stored.unlockedIds));
	updateMyProgress();
}

initSaveFileModal();
