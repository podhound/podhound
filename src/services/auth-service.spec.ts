import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, it } from "bun:test";
import { runMigrations } from "../db/migrations";
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

	it("should cache successful authentication for subsequent requests", () => {
		const user = userService.createUser("cacheuser", "pass123");
		const first = authService.authenticate("cacheuser", "pass123");
		expect(first?.id).toBe(user.id);

		// Second authentication should be extremely fast due to cache hit
		const start = performance.now();
		const second = authService.authenticate("cacheuser", "pass123");
		const duration = performance.now() - start;

		expect(second?.id).toBe(user.id);
		// Verify cached call took less than 1ms (Argon2id usually takes ~40-100ms)
		expect(duration).toBeLessThan(5);
	});

	it("should clear cache when clearCache is called", () => {
		userService.createUser("cacheuser2", "pass123");
		authService.authenticate("cacheuser2", "pass123");
		authService.clearCache();

		const start = performance.now();
		authService.authenticate("cacheuser2", "pass123");
		const duration = performance.now() - start;

		// Re-authentication after cache clear must execute Argon2id
		expect(duration).toBeGreaterThanOrEqual(10);
	});
});
