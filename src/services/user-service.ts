import type { Database, Statement } from "bun:sqlite";
import type { User } from "../types";

export class UserService {
	private getUserByUsernameStmt: Statement;
	private createUserStmt: Statement;
	private checkUserExistsStmt: Statement;
	private updateUserPasswordStmt: Statement;
	private getAllUsersStmt: Statement;

	constructor(private db: Database) {
		this.getUserByUsernameStmt = this.db.prepare(
			"SELECT * FROM users WHERE username = ?",
		);
		this.createUserStmt = this.db.prepare(
			"INSERT INTO users (username, password_hash) VALUES (?, ?)",
		);
		this.checkUserExistsStmt = this.db.prepare(
			"SELECT 1 FROM users WHERE username = ?",
		);
		this.updateUserPasswordStmt = this.db.prepare(
			"UPDATE users SET password_hash = ? WHERE username = ?",
		);
		this.getAllUsersStmt = this.db.prepare("SELECT id, username FROM users");
	}

	public getUserByUsername(username: string): User | null {
		return this.getUserByUsernameStmt.get(username) as User | null;
	}

	public createUser(username: string, password_raw: string): User {
		const password_hash = Bun.password.hashSync(password_raw, {
			algorithm: "bcrypt",
			cost: 10,
		});
		const result = this.createUserStmt.run(username, password_hash);
		return { id: Number(result.lastInsertRowid), username, password_hash };
	}

	public updateUserPassword(username: string, password_raw: string): boolean {
		const userExists = this.checkUserExistsStmt.get(username);
		if (!userExists) {
			return false;
		}

		const password_hash = Bun.password.hashSync(password_raw, {
			algorithm: "bcrypt",
			cost: 10,
		});
		const result = this.updateUserPasswordStmt.run(password_hash, username);
		return result.changes > 0;
	}

	public getAllUsers(): { id: number; username: string }[] {
		return this.getAllUsersStmt.all() as {
			id: number;
			username: string;
		}[];
	}
}
