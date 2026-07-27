import type { Database } from "bun:sqlite";
import type { User } from "../types";

export class UserService {
	constructor(private db: Database) {}

	public getUserByUsername(username: string): User | null {
		return this.db
			.prepare("SELECT * FROM users WHERE username = ?")
			.get(username) as User | null;
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
