import unlocksData from "./data/unlocks.json";
import itemQuality from "./data/item-quality.json";
import type { UnlocksData } from "./types/unlocks";
import type { ItemQualityMap } from "./types/item-quality";
import { loadStoredProgress } from "./modules/progress";
import { renderRecommendedUnlocks } from "./modules/recommended-unlocks";

const data = unlocksData as UnlocksData;
const qualityMap = itemQuality as ItemQualityMap;
const stored = loadStoredProgress();

renderRecommendedUnlocks(data, qualityMap, stored ? new Set(stored.unlockedIds) : null);
