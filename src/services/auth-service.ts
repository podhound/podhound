import type { Database } from "bun:sqlite";
import type { Config } from "../config";

export interface User {
	id: number;
	username: string;
	password_hash: string;
}

export class AuthService {
	constructor(
		private db: Database,
		private config: Config,
	) {}

	public getOrCreateUser(username: string, password?: string): User | null {
		const user = this.db
			.prepare("SELECT * FROM users WHERE username = ?")
			.get(username) as User | null;

		if (!user) {
			if (!password) {
				return null;
			}
			if (!this.config.autoRegister) {
				return null; // Respect config
			}
			return this.createUser(username, password);
		}

		if (password) {
			const isValid = Bun.password.verifySync(password, user.password_hash);
			if (!isValid) {
				return null;
			}
		}

		return user;
	}

	public createUser(username: string, password_raw: string): User {
		const password_hash = Bun.password.hashSync(password_raw);
		const result = this.db
			.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
			.run(username, password_hash);
		return { id: Number(result.lastInsertRowid), username, password_hash };
	}

	public updateUserPassword(username: string, password_raw: string): boolean {
		const userExists = this.db
			.prepare("SELECT 1 FROM users WHERE username = ?")
			.get(username);
		if (!userExists) {
			return false;
		}

		const password_hash = Bun.password.hashSync(password_raw);
		const result = this.db
			.prepare("UPDATE users SET password_hash = ? WHERE username = ?")
			.run(password_hash, username);
		return result.changes > 0;
	}

	public getAllUsers(): { id: number; username: string }[] {
		return this.db.prepare("SELECT id, username FROM users").all() as {
			id: number;
			username: string;
		}[];
	}
}
