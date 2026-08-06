import type { LogLevel } from "../types";

export class Config {
	public readonly port: number;
	public readonly databasePath: string;
	public readonly autoRegister: boolean;
	public readonly logLevel: LogLevel;

	// Memory cache, session, rate limiting & garbage collection settings
	public readonly authCacheTtlMs: number;
	public readonly sessionTtlSec: number;
	public readonly gcIntervalMs: number;
	public readonly rateLimitWindowMs: number;
	public readonly rateLimitMaxAttempts: number;

	constructor(env: Record<string, string | undefined> = process.env) {
		this.port = parseInt(env.PORT || "8080", 10);
		this.databasePath = env.DATABASE_PATH || "data/podhound.db";
		this.autoRegister = env.AUTO_REGISTER === "true";

		const defaultLevel: LogLevel = env.NODE_ENV === "test" ? "silent" : "info";
		this.logLevel = (env.LOG_LEVEL as LogLevel) || defaultLevel;

		this.authCacheTtlMs = 5 * 60 * 1000; // 5 minutes
		this.sessionTtlSec = 30 * 24 * 60 * 60; // 30 days
		this.gcIntervalMs = 15 * 60 * 1000; // 15 minutes
		this.rateLimitWindowMs = 60_000; // 1 minute
		this.rateLimitMaxAttempts = 5;
	}
}
