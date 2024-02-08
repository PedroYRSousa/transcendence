import { Injectable } from '@nestjs/common';

export interface I_Value {
	ttl: number;
	value: unknown;
	createAt: number;
}

@Injectable()
export class CacheService {
	private static cache: Map<unknown, I_Value> = new Map<unknown, I_Value>();

	constructor() {
		this.init();
	}

	private init() {
		setInterval(() => {
			for (const [key, value] of CacheService.cache) {
				if (Date.now() - value.createAt >= value.ttl * 1000) this.delete(key);
			}
		}, 1000);
	}

	public set(key: unknown, value: unknown, ttl: number = -1) {
		CacheService.cache.set(key, { value, ttl, createAt: Date.now() });
	}

	public get(key: unknown): unknown | null {
		if (CacheService.cache.has(key)) return CacheService.cache.get(key).value;

		return null;
	}

	public delete(key: unknown) {
		if (CacheService.cache.has(key)) return CacheService.cache.delete(key);
	}
}
