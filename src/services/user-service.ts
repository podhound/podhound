import type { Database, Statement } from "bun:sqlite";
import type { Config } from "../config";
import type { User, UserSettings } from "../types";
import { resolveUserSettings } from "../utils";

export class UserService {
	private getUserByUsernameStmt: Statement;
	private createUserStmt: Statement;
	private checkUserExistsStmt: Statement;
	private updateUserPasswordStmt: Statement;
	private getAllUsersStmt: Statement;
	private setUserSettingStmt: Statement;

	constructor(
		private db: Database,
		private config?: Config,
	) {
		this.getUserByUsernameStmt = this.db.prepare(
			"SELECT id, username, password_hash, settings FROM users WHERE username = ?",
		);
		this.createUserStmt = this.db.prepare(
			"INSERT INTO users (username, password_hash, settings) VALUES (?, ?, '{}')",
		);
		this.checkUserExistsStmt = this.db.prepare(
			"SELECT 1 FROM users WHERE username = ?",
		);
		this.updateUserPasswordStmt = this.db.prepare(
			"UPDATE users SET password_hash = ? WHERE username = ?",
		);
		this.getAllUsersStmt = this.db.prepare(
			"SELECT id, username, settings FROM users",
		);
		this.setUserSettingStmt = this.db.prepare(
			"UPDATE users SET settings = json_set(COALESCE(settings, '{}'), '$.' || ?, ?) WHERE username = ?",
		);
	}

	private parseSettings(raw?: string | null): UserSettings {
		if (!raw) {
			return {};
		}
		try {
			const parsed = JSON.parse(raw);
			return typeof parsed === "object" &&
				parsed !== null &&
				!Array.isArray(parsed)
				? (parsed as UserSettings)
				: {};
		} catch {
			return {};
		}
	}

	public getUserByUsername(username: string): User | null {
		const row = this.getUserByUsernameStmt.get(username) as {
			id: number;
			username: string;
			password_hash: string;
			settings?: string;
		} | null;

		if (!row) {
			return null;
		}
		const settings = this.parseSettings(row.settings);
		const effectiveSettings = resolveUserSettings(
			settings,
			this.config?.defaultUserSettings,
		);

		return {
			id: row.id,
			username: row.username,
			password_hash: row.password_hash,
			settings,
			effectiveSettings,
		};
	}

	public createUser(username: string, password_raw: string): User {
		const password_hash = Bun.password.hashSync(password_raw, {
			algorithm: "bcrypt",
			cost: 10,
		});
		const result = this.createUserStmt.run(username, password_hash);
		const settings: UserSettings = {};
		const effectiveSettings = resolveUserSettings(
			settings,
			this.config?.defaultUserSettings,
		);

		return {
			id: Number(result.lastInsertRowid),
			username,
			password_hash,
			settings,
			effectiveSettings,
		};
	}

	public updateUserPassword(username: string, password_raw: string): boolean {
		if (!this.checkUserExistsStmt.get(username)) {
			return false;
		}

		const password_hash = Bun.password.hashSync(password_raw, {
			algorithm: "bcrypt",
			cost: 10,
		});
		const result = this.updateUserPasswordStmt.run(password_hash, username);
		return result.changes > 0;
	}

	public setUserSetting(
		username: string,
		key: keyof UserSettings,
		value: unknown,
	): boolean {
		const result = this.setUserSettingStmt.run(key, value, username);
		return result.changes > 0;
	}

	public getUserSettings(username: string): {
		settings: UserSettings;
		effective: Required<UserSettings>;
	} | null {
		const user = this.getUserByUsername(username);
		if (!user) {
			return null;
		}
		return {
			settings: user.settings,
			effective:
				user.effectiveSettings ||
				resolveUserSettings(user.settings, this.config?.defaultUserSettings),
		};
	}

	public isLegacyPasswordHash(hash: string): boolean {
		return !hash.startsWith("$2b$");
	}

	public getAllUsers(): {
		id: number;
		username: string;
		settings: UserSettings;
	}[] {
		const rows = this.getAllUsersStmt.all() as {
			id: number;
			username: string;
			settings?: string;
		}[];
		return rows.map((r) => ({
			id: r.id,
			username: r.username,
			settings: this.parseSettings(r.settings),
		}));
	}
}
