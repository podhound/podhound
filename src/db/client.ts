import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const dbPath = process.env.DATABASE_PATH || "data/podhound.db";

try {
  mkdirSync(dirname(dbPath), { recursive: true });
} catch (e) {}

export const db = new Database(dbPath);

// Enable Foreign Key support and WAL mode for better concurrency
db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA journal_mode = WAL;");
