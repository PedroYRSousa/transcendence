import { join } from 'path';
import { Injectable } from '@nestjs/common';
import { writeFileSync, statSync, rmSync, mkdirSync } from 'fs';

@Injectable()
export class FileService {
	filesToExpires: Map<string, number> = new Map<string, number>();

	constructor() {
		this.init();
	}

	private init() {
		try {
			mkdirSync(join(process.env.BACK_PATH, 'public'));
		} catch {
		} finally {
			setInterval(() => {
				for (const [file, timeToExpires] of this.filesToExpires) {
					try {
						const stats = statSync(file);
						const timeDelta = Date.now() - stats.mtime.getTime();
						if (timeDelta >= timeToExpires) {
							rmSync(file, { force: true, recursive: true });
							this.filesToExpires.delete(file);
						}
					} catch {}
				}
			}, 100);
		}
	}

	public saveFile(name: string, data: ArrayBuffer, timeToExpires: number = -1) {
		const path = join(process.env.BACK_PATH, 'public', name);

		writeFileSync(path, Buffer.from(data));

		if (timeToExpires != -1) this.filesToExpires.set(path, timeToExpires);
	}

	public getPath(name: string) {
		return `/public/${name}`;
	}
}
