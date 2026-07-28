import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Config } from "../config";
import type { Logger } from "../logger";
import { runMigrations } from "./migrations";

export function createDatabase(config: Config, logger?: Logger): Database {
	if (config.databasePath !== ":memory:") {
		mkdirSync(dirname(config.databasePath), { recursive: true });
	}

	const db = new Database(config.databasePath);
	db.exec("PRAGMA journal_mode = WAL;");

	// Run SQLite migrations at startup
	runMigrations(db, logger);

	return db;
}
