import type { Database } from "bun:sqlite";
import type { Logger } from "../../logger";
import m001 from "./001_initial_schema.sql" with { type: "text" };

const migrations = [{ name: "001_initial_schema.sql", sql: m001 }];

export function runMigrations(db: Database, logger?: Logger): void {
	db.transaction(() => {
		db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

		for (const migration of migrations) {
			const existing = db
				.prepare("SELECT id FROM _migrations WHERE name = ?")
				.get(migration.name);

			if (!existing) {
				logger?.info(`[DB] Applying migration: ${migration.name}`);
				db.exec(migration.sql);
				db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(
					migration.name,
				);
				logger?.info(`[DB] Successfully applied migration: ${migration.name}`);
			}
		}
	})();
}
