export class BinaryReader {
	offset = 0;

	constructor(private readonly view: DataView) {}

	get length(): number {
		return this.view.byteLength;
	}

	get remaining(): number {
		return this.view.byteLength - this.offset;
	}

	readUint8(): number {
		const value = this.view.getUint8(this.offset);
		this.offset += 1;
		return value;
	}

	readUint32(): number {
		const value = this.view.getUint32(this.offset, true);
		this.offset += 4;
		return value;
	}

	readInt32(): number {
		const value = this.view.getInt32(this.offset, true);
		this.offset += 4;
		return value;
	}

	readString(length: number): string {
		let result = "";

		for (let i = 0; i < length; i++) {
			const byte = this.view.getUint8(this.offset + i);

			if (byte === 0) {
				continue;
			}

			result += String.fromCharCode(byte);
		}

		this.offset += length;

		return result;
	}

	skip(count: number): void {
		this.offset += count;
	}
}
