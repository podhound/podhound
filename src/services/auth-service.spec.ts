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
		authService = new AuthService(userService, db);
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
		expect(duration).toBeLessThan(5);
	});

	it("should clear cache when clearCache is called", () => {
		userService.createUser("cacheuser2", "pass123");
		authService.authenticate("cacheuser2", "pass123");
		authService.clearCache();

		const authenticated = authService.authenticate("cacheuser2", "pass123");
		expect(authenticated).not.toBeNull();
	});

	it("should transparently migrate legacy Argon2id hash to bcrypt on login", () => {
		const argonHash = Bun.password.hashSync("legacyPass123", {
			algorithm: "argon2id",
		});
		db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(
			"legacyUser",
			argonHash,
		);

		const beforeUser = userService.getUserByUsername("legacyUser");
		expect(beforeUser?.password_hash).toContain("$argon2id$");

		const authenticated = authService.authenticate(
			"legacyUser",
			"legacyPass123",
		);
		expect(authenticated).not.toBeNull();

		const afterUser = userService.getUserByUsername("legacyUser");
		expect(afterUser?.password_hash).toContain("$2b$");
	});

	it("should return null for non-existent or expired session ID", () => {
		expect(authService.getUserBySessionId("non-existent")).toBeNull();

		const user = userService.createUser("expireuser", "pass123");
		const sessionId = authService.createSession(user.id);

		// Manually expire session in DB
		db.prepare("UPDATE sessions SET expires_at = ? WHERE id = ?").run(
			Math.floor(Date.now() / 1000) - 3600,
			sessionId,
		);

		expect(authService.getUserBySessionId(sessionId)).toBeNull();
	});

	it("should retrieve user by session ID with parsed settings and resolved effectiveSettings", () => {
		const user = userService.createUser("sessionuser", "pass123");
		userService.setUserSetting(
			"sessionuser",
			"action_map_delete",
			"prepend_play",
		);

		const sessionId = authService.createSession(user.id);
		const sessionUser = authService.getUserBySessionId(sessionId);

		expect(sessionUser).not.toBeNull();
		expect(sessionUser?.id).toBe(user.id);
		expect(sessionUser?.username).toBe("sessionuser");
		expect(sessionUser?.settings).toEqual({
			action_map_delete: "prepend_play",
		});
		expect(sessionUser?.effectiveSettings).toEqual({
			action_map_delete: "prepend_play",
		});
	});

	it("should return null if db is not configured in authService", () => {
		const authWithoutDb = new AuthService(userService);
		expect(authWithoutDb.getUserBySessionId("any-id")).toBeNull();
		expect(() => authWithoutDb.createSession(1)).toThrow(
			"Database not provided to AuthService",
		);
	});
});
