import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, it, spyOn } from "bun:test";
import type { Config } from "../config";
import { runMigrations } from "../db/migrate";
import { AuthService } from "./auth-service";

describe("AuthService", () => {
	let db: Database;
	let config: Config;
	let authService: AuthService;

	beforeEach(() => {
		db = new Database(":memory:");
		runMigrations(db);
		config = { autoRegister: false } as Config;
		authService = new AuthService(db, config);
	});

	it("should return null if user does not exist and no password provided", () => {
		const user = authService.getOrCreateUser("nonexistent");
		expect(user).toBeNull();
	});

	it("should return null if user does not exist and autoRegister is false", () => {
		const user = authService.getOrCreateUser("newuser", "pass");
		expect(user).toBeNull();
	});

	it("should create a new user when autoRegister is true and password is provided", () => {
		const autoConfig = { autoRegister: true } as Config;
		const autoAuthService = new AuthService(db, autoConfig);
		const user = autoAuthService.getOrCreateUser("newuser", "secure123");
		expect(user).not.toBeNull();
		expect(user?.username).toBe("newuser");

		const row = db
			.prepare("SELECT * FROM users WHERE username = ?")
			.get("newuser");
		expect(row).not.toBeNull();
	});

	it("should unconditionally create a user", () => {
		const user = authService.createUser("admin", "pass");
		expect(user).not.toBeNull();
		expect(user.username).toBe("admin");
	});

	it("should update a user password", () => {
		authService.createUser("testuser", "pass");
		const updated = authService.updateUserPassword("testuser", "newpass");
		expect(updated).toBe(true);

		const user = authService.getOrCreateUser("testuser", "newpass"); // should succeed
		expect(user).not.toBeNull();
	});

	it("should return false early when updating password for non-existent user without hashing", () => {
		const hashSpy = spyOn(Bun.password, "hashSync");
		const updated = authService.updateUserPassword("nonexistent", "newpass");
		expect(updated).toBe(false);
		expect(hashSpy).not.toHaveBeenCalled();
		hashSpy.mockRestore();
	});

	it("should get all users", () => {
		authService.createUser("user1", "p");
		authService.createUser("user2", "p");
		const users = authService.getAllUsers();
		expect(users.length).toBeGreaterThanOrEqual(2);
		expect(users.map((u) => u.username)).toContain("user1");
	});

	it("should fail authentication with wrong password", () => {
		authService.createUser("testuser", "secure123");
		const user = authService.getOrCreateUser("testuser", "wrongpass");
		expect(user).toBeNull();
	});

	it("should succeed authentication with correct password", () => {
		const original = authService.createUser("testuser", "secure123");
		const authenticated = authService.getOrCreateUser("testuser", "secure123");
		expect(authenticated).not.toBeNull();
		expect(authenticated?.id).toBe(original.id);
	});
});
