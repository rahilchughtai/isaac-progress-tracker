import { BinaryReader } from "./binary-reader";
import { readHeader } from "./header";
import { parseChunks } from "./chunks";
import type { ParsedSaveProgress } from "./types";

export async function parseSaveFile(file: File): Promise<ParsedSaveProgress> {
	const buffer = await file.arrayBuffer();
	const reader = new BinaryReader(new DataView(buffer));

	const header = readHeader(reader);
	const { achievements } = parseChunks(reader);

	const achievementIds = new Set<string>();

	achievements.forEach((flag, index) => {
		if (flag !== 0) {
			achievementIds.add(String(index));
		}
	});

	return {
		achievementIds,
		saveFormatVersion: header.magic,
	};
}
