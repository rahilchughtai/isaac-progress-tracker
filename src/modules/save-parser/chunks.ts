import { BinaryReader } from "./binary-reader";
import { SaveParseError } from "./types";

// The chunk layout below is transcribed from the public Kaitai Struct
// definition for this format:
// https://github.com/Zamiell/isaac-save-viewer/blob/main/static/lib/IsaacSaveFile.ksy
//
// The save file always contains exactly 11 chunks, one per ChunkType, each
// prefixed by { type: s4, len: s4 }. The `len` field is explicitly documented
// upstream as unreliable ("this tends to be wrong"), so it cannot be used to
// skip a chunk's body - each body must be parsed structurally instead, using
// its own internal `count` field(s) to know how many bytes/elements to consume.
export const enum ChunkType {
	Achievements = 1,
	Counters = 2,
	LevelCounters = 3,
	Collectibles = 4,
	Minibosses = 5,
	Bosses = 6,
	ChallengeCounters = 7,
	CutsceneCounters = 8,
	GameSettings = 9,
	SpecialSeedCounters = 10,
	BestiaryCounters = 11,
}

const NUM_CHUNKS = 11;

export interface ParsedChunks {
	// One byte per achievement id (index = id), non-zero means unlocked.
	achievements: Uint8Array;
}

// { count: s4, values: u1[count] } - shape shared by achievements, collectibles,
// minibosses, bosses, challenge_counters, and special_seed_counters chunks.
function readCountPrefixedBytes(reader: BinaryReader): Uint8Array {
	const count = reader.readInt32();
	const bytes = new Uint8Array(count);

	for (let i = 0; i < count; i++) {
		bytes[i] = reader.readUint8();
	}

	return bytes;
}

// { count: s4, values: s4[count] } - shape shared by counters, level_counters,
// cutscene_counters, and game_settings chunks.
function skipCountPrefixedInt32s(reader: BinaryReader): void {
	const count = reader.readInt32();
	reader.skip(count * 4);
}

// bestiary_counters_chunk: { count: u4, counters: bestiary_counter[count] },
// where each bestiary_counter is { type: s4, count: s4, values: entity_value[count/4] }
// and each entity_value is two s4 fields (entity id, value) = 8 bytes.
function skipBestiaryCountersChunk(reader: BinaryReader): void {
	const count = reader.readUint32();

	for (let i = 0; i < count; i++) {
		reader.skip(4); // bestiary_type
		const innerCount = reader.readInt32();
		const numEntityValues = innerCount / 4;
		reader.skip(numEntityValues * 8);
	}
}

export function parseChunks(reader: BinaryReader): ParsedChunks {
	let achievements: Uint8Array | null = null;

	for (let i = 0; i < NUM_CHUNKS; i++) {
		const type = reader.readInt32();
		reader.readInt32(); // len - documented upstream as unreliable, not used

		switch (type) {
			case ChunkType.Achievements:
				achievements = readCountPrefixedBytes(reader);
				break;
			case ChunkType.Counters:
			case ChunkType.LevelCounters:
			case ChunkType.CutsceneCounters:
			case ChunkType.GameSettings:
				skipCountPrefixedInt32s(reader);
				break;
			case ChunkType.Collectibles:
			case ChunkType.Minibosses:
			case ChunkType.Bosses:
			case ChunkType.ChallengeCounters:
			case ChunkType.SpecialSeedCounters:
				readCountPrefixedBytes(reader);
				break;
			case ChunkType.BestiaryCounters:
				skipBestiaryCountersChunk(reader);
				break;
			default:
				throw new SaveParseError(
					`Unrecognized chunk type (${type}) while reading this save file - the save format may have changed.`,
				);
		}
	}

	if (!achievements) {
		throw new SaveParseError("Couldn't find achievement data in this save file.");
	}

	return { achievements };
}
