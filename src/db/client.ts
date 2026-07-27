import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Config } from "../config";

export function createDatabase(config: Config): Database {
	if (config.databasePath !== ":memory:") {
		mkdirSync(dirname(config.databasePath), { recursive: true });
	}
	const db = new Database(config.databasePath);
	db.exec("PRAGMA journal_mode = WAL;");
	return db;
}
