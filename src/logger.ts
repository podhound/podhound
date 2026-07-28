import type { LogLevel } from "./types";

const LOG_LEVEL_WEIGHTS: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
	silent: 4,
};

export class Logger {
	private weight: number;

	constructor(level: LogLevel = "info") {
		this.weight = LOG_LEVEL_WEIGHTS[level] ?? LOG_LEVEL_WEIGHTS.info;
	}

	public debug(...args: unknown[]): void {
		if (this.weight <= LOG_LEVEL_WEIGHTS.debug) {
			console.debug(...args);
		}
	}

	public info(...args: unknown[]): void {
		if (this.weight <= LOG_LEVEL_WEIGHTS.info) {
			console.log(...args);
		}
	}

	public warn(...args: unknown[]): void {
		if (this.weight <= LOG_LEVEL_WEIGHTS.warn) {
			console.warn(...args);
		}
	}

	public error(...args: unknown[]): void {
		if (this.weight <= LOG_LEVEL_WEIGHTS.error) {
			console.error(...args);
		}
	}
}
