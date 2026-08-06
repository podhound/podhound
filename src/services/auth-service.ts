import type { Database, Statement } from "bun:sqlite";
import type { Config } from "../config";
import type { User } from "../types";
import type { UserService } from "./user-service";

export class AuthService {
	private authCache = new Map<string, { user: User; expiresAt: number }>();
	private updateSessionStmt?: Statement;
	private insertSessionStmt?: Statement;
	private getUserBySessionStmt?: Statement;

	constructor(
		private userService: UserService,
		private db?: Database,
		private config?: Config,
	) {
		if (this.db) {
			this.updateSessionStmt = this.db.prepare(
				"UPDATE sessions SET id = ?, expires_at = ?, created_at = CURRENT_TIMESTAMP WHERE user_id = ?",
			);
			this.insertSessionStmt = this.db.prepare(
				"INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
			);
			this.getUserBySessionStmt = this.db.prepare(
				`SELECT u.* FROM users u 
				 JOIN sessions s ON u.id = s.user_id 
				 WHERE s.id = ? AND s.expires_at > ?`,
			);
		}
	}

	public authenticate(username: string, password_raw: string): User | null {
		const cacheKey = `${username}:${password_raw}`;
		const now = Date.now();
		const cached = this.authCache.get(cacheKey);
		if (cached && cached.expiresAt > now) {
			return cached.user;
		}

		const user = this.userService.getUserByUsername(username);
		if (!user) {
			return null;
		}

		const isValid = Bun.password.verifySync(password_raw, user.password_hash);
		if (!isValid) {
			this.authCache.delete(cacheKey);
			return null;
		}

		const ttl = this.config?.authCacheTtlMs ?? 5 * 60 * 1000;
		this.authCache.set(cacheKey, {
			user,
			expiresAt: now + ttl,
		});
		return user;
	}

	public clearCache(): void {
		this.authCache.clear();
	}

	public createSession(userId: number): string {
		if (!this.db) {
			throw new Error("Database not provided to AuthService");
		}
		const sessionId = crypto.randomUUID();
		const now = Math.floor(Date.now() / 1000);
		const ttlSec = this.config?.sessionTtlSec ?? 30 * 24 * 60 * 60;
		const expiresAt = now + ttlSec;

		const updateStmt =
			this.updateSessionStmt ||
			this.db.prepare(
				"UPDATE sessions SET id = ?, expires_at = ?, created_at = CURRENT_TIMESTAMP WHERE user_id = ?",
			);
		const updated = updateStmt.run(sessionId, expiresAt, userId);

		if (updated.changes === 0) {
			const insertStmt =
				this.insertSessionStmt ||
				this.db.prepare(
					"INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
				);
			insertStmt.run(sessionId, userId, expiresAt);
		}

		return sessionId;
	}

	public getUserBySessionId(sessionId: string): User | null {
		if (!this.db) {
			return null;
		}
		const now = Math.floor(Date.now() / 1000);
		const stmt =
			this.getUserBySessionStmt ||
			this.db.prepare(
				`SELECT u.* FROM users u 
				 JOIN sessions s ON u.id = s.user_id 
				 WHERE s.id = ? AND s.expires_at > ?`,
			);
		return (stmt.get(sessionId, now) as User | null) || null;
	}
}
