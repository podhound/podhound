import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, it } from "bun:test";
import { runMigrations } from "../db/migrate";
import { AuthService } from "./auth-service";
import { UserService } from "./user-service";

describe("AuthService", () => {
	let db: Database;
	let userService: UserService;
	let authService: AuthService;

	beforeEach(() => {
		db = new Database(":memory:");
		runMigrations(db);
		userService = new UserService(db);
		authService = new AuthService(userService);
	});

	it("should return null if user does not exist", () => {
		const user = authService.authenticate("nonexistent", "pass");
		expect(user).toBeNull();
	});

	it("should fail authentication with wrong password", () => {
		userService.createUser("testuser", "secure123");
		const user = authService.authenticate("testuser", "wrongpass");
		expect(user).toBeNull();
	});

	it("should succeed authentication with correct password", () => {
		const original = userService.createUser("testuser", "secure123");
		const authenticated = authService.authenticate("testuser", "secure123");
		expect(authenticated).not.toBeNull();
		expect(authenticated?.id).toBe(original.id);
	});
});
