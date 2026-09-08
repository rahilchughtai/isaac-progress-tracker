import { BinaryReader } from "./binary-reader";
import { SaveParseError } from "./types";

// Isaac save files start with a magic string identifying the game version the
// save was written by, e.g. "ISAACNGSAVE06R" (Rebirth) through "ISAACNGSAVE09R"
// (Afterbirth+ / Repentance, which share the same magic and can only be told
// apart by inspecting the achievements chunk length), followed by a 4-byte
// signed CRC. Layout confirmed against the public Kaitai Struct definition at
// https://github.com/Zamiell/isaac-save-viewer/blob/main/static/lib/IsaacSaveFile.ksy
// and against a real Repentance save file.
const MAGIC_LENGTH = 16;
const MAGIC_PATTERN = /^ISAACNGSAVE0([6-9])R/;

export interface SaveHeader {
	magic: string;
	version: number;
	crc: number;
}

export function readHeader(reader: BinaryReader): SaveHeader {
	if (reader.remaining < MAGIC_LENGTH + 4) {
		throw new SaveParseError("This file is too small to be an Isaac save file.");
	}

	const magic = reader.readString(MAGIC_LENGTH);
	const match = MAGIC_PATTERN.exec(magic);

	if (!match) {
		throw new SaveParseError(
			"This doesn't look like a Binding of Isaac save file. Make sure you selected a persistentgamedata#.dat file.",
		);
	}

	const version = Number(match[1]);

	if (version < 9) {
		throw new SaveParseError(
			"This save file is from an older version of the game. Only Afterbirth+ and Repentance saves are supported.",
		);
	}

	const crc = reader.readInt32();

	return { magic, version, crc };
}
