export class SaveParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SaveParseError";
	}
}

export interface ParsedSaveProgress {
	achievementIds: Set<string>;
	saveFormatVersion: string;
}
