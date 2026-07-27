import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, it } from "bun:test";
import { runMigrations } from "../db/migrate";
import { AuthService } from "./auth-service";

describe("AuthService", () => {
	let db: Database;
	let authService: AuthService;

	beforeEach(() => {
		db = new Database(":memory:");
		runMigrations(db);
		authService = new AuthService(db);
	});

	it("should return null if user does not exist and no password provided", () => {
		const user = authService.getOrCreateUser("nonexistent");
		expect(user).toBeNull();
	});

	it("should create a new user when password is provided", () => {
		const user = authService.getOrCreateUser("newuser", "secure123");
		expect(user).not.toBeNull();
		expect(user?.username).toBe("newuser");

		const row = db
			.prepare("SELECT * FROM users WHERE username = ?")
			.get("newuser");
		expect(row).not.toBeNull();
	});

	it("should fail authentication with wrong password", () => {
		authService.getOrCreateUser("testuser", "secure123");
		const user = authService.getOrCreateUser("testuser", "wrongpass");
		expect(user).toBeNull();
	});

	it("should succeed authentication with correct password", () => {
		const original = authService.getOrCreateUser("testuser", "secure123");
		const authenticated = authService.getOrCreateUser("testuser", "secure123");
		expect(authenticated).not.toBeNull();
		expect(authenticated?.id).toBe(original?.id);
	});
});
