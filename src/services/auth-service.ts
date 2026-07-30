import type { Database } from "bun:sqlite";
import type { User } from "../types";
import type { UserService } from "./user-service";

export class AuthService {
	constructor(
		private userService: UserService,
		private db: Database,
	) {}

	public authenticate(username: string, password_raw: string): User | null {
		const user = this.userService.getUserByUsername(username);
		if (!user) {
			return null;
		}

		const isValid = Bun.password.verifySync(password_raw, user.password_hash);
		if (!isValid) {
			return null;
		}

		return user;
	}

	public createSession(userId: number): string {
		const sessionId = crypto.randomUUID();
		const now = Math.floor(Date.now() / 1000);
		const expiresAt = now + 30 * 24 * 60 * 60; // 30 days

		const updated = this.db
			.prepare(
				"UPDATE sessions SET id = ?, expires_at = ?, created_at = CURRENT_TIMESTAMP WHERE user_id = ?",
			)
			.run(sessionId, expiresAt, userId);

		if (updated.changes === 0) {
			this.db
				.prepare(
					"INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
				)
				.run(sessionId, userId, expiresAt);
		}

		return sessionId;
	}

	public getUserBySessionId(sessionId: string): User | null {
		const now = Math.floor(Date.now() / 1000);
		return (
			(this.db
				.prepare(
					`SELECT u.* FROM users u 
					 JOIN sessions s ON u.id = s.user_id 
					 WHERE s.id = ? AND s.expires_at > ?`,
				)
				.get(sessionId, now) as User | null) || null
		);
	}
}
