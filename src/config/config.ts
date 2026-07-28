import type { LogLevel } from "../types";

export class Config {
	public readonly port: number;
	public readonly databasePath: string;
	public readonly autoRegister: boolean;
	public readonly logLevel: LogLevel;

	constructor(env: Record<string, string | undefined> = process.env) {
		this.port = parseInt(env.PORT || "8080", 10);
		this.databasePath = env.DATABASE_PATH || "data/podhound.db";
		this.autoRegister = env.AUTO_REGISTER === "true";

		const defaultLevel: LogLevel = env.NODE_ENV === "test" ? "silent" : "info";
		this.logLevel = (env.LOG_LEVEL as LogLevel) || defaultLevel;
	}
}
