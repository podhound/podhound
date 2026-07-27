import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, it } from "bun:test";
import type { Config } from "../config";
import { runMigrations } from "../db/migrate";
import { AuthService } from "./auth-service";
import { UserService } from "./user-service";

describe("AuthService", () => {
	let db: Database;
	let config: Config;
	let userService: UserService;
	let authService: AuthService;

	beforeEach(() => {
		db = new Database(":memory:");
		runMigrations(db);
		config = { autoRegister: false } as Config;
		userService = new UserService(db);
		authService = new AuthService(userService, config);
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
		const autoAuthService = new AuthService(userService, autoConfig);
		const user = autoAuthService.getOrCreateUser("newuser", "secure123");
		expect(user).not.toBeNull();
		expect(user?.username).toBe("newuser");

		const row = db
			.prepare("SELECT * FROM users WHERE username = ?")
			.get("newuser");
		expect(row).not.toBeNull();
	});

	it("should fail authentication with wrong password", () => {
		userService.createUser("testuser", "secure123");
		const user = authService.getOrCreateUser("testuser", "wrongpass");
		expect(user).toBeNull();
	});

	it("should succeed authentication with correct password", () => {
		const original = userService.createUser("testuser", "secure123");
		const authenticated = authService.getOrCreateUser("testuser", "secure123");
		expect(authenticated).not.toBeNull();
		expect(authenticated?.id).toBe(original.id);
	});
});
