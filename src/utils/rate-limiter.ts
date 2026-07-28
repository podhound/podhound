export class RateLimiter {
	private attempts = new Map<string, { count: number; resetAt: number }>();

	constructor(
		private maxAttempts: number = 5,
		private windowMs: number = 60_000,
	) {}

	public isRateLimited(key: string): boolean {
		const now = Date.now();
		const record = this.attempts.get(key);

		if (!record || now > record.resetAt) {
			return false;
		}

		return record.count >= this.maxAttempts;
	}

	public recordAttempt(key: string): void {
		const now = Date.now();
		const record = this.attempts.get(key);

		if (!record || now > record.resetAt) {
			this.attempts.set(key, { count: 1, resetAt: now + this.windowMs });
			this.cleanupOldEntries(now);
			return;
		}

		record.count += 1;
	}

	public reset(key: string): void {
		this.attempts.delete(key);
	}

	private cleanupOldEntries(now: number): void {
		if (this.attempts.size < 1000) {
			return;
		}
		for (const [k, entry] of this.attempts) {
			if (now > entry.resetAt) {
				this.attempts.delete(k);
			}
		}
	}
}
