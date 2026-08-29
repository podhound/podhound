import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, it, spyOn } from "bun:test";
import { Config } from "../config";
import { runMigrations } from "../db/migrations";
import { UserService } from "./user-service";

describe("UserService", () => {
	let db: Database;
	let userService: UserService;

	beforeEach(() => {
		db = new Database(":memory:");
		runMigrations(db);
		userService = new UserService(db);
	});

	it("should return null for non-existent user", () => {
		const user = userService.getUserByUsername("nonexistent");
		expect(user).toBeNull();
	});

	it("should unconditionally create a user", () => {
		const user = userService.createUser("admin", "pass");
		expect(user).not.toBeNull();
		expect(user.username).toBe("admin");
	});

	it("should get user by username after creation", () => {
		userService.createUser("admin", "pass");
		const user = userService.getUserByUsername("admin");
		expect(user).not.toBeNull();
		expect(user?.username).toBe("admin");
	});

	it("should update a user password", () => {
		userService.createUser("testuser", "pass");
		const updated = userService.updateUserPassword("testuser", "newpass");
		expect(updated).toBe(true);
	});

	it("should return false early when updating password for non-existent user without hashing", () => {
		const hashSpy = spyOn(Bun.password, "hashSync");
		const updated = userService.updateUserPassword("nonexistent", "newpass");
		expect(updated).toBe(false);
		expect(hashSpy).not.toHaveBeenCalled();
		hashSpy.mockRestore();
	});

	it("should get all users", () => {
		userService.createUser("user1", "p");
		userService.createUser("user2", "p");
		const users = userService.getAllUsers();
		expect(users.length).toBeGreaterThanOrEqual(2);
		expect(users.map((u) => u.username)).toContain("user1");
	});

	it("should correctly identify legacy password hashes", () => {
		expect(userService.isLegacyPasswordHash("$argon2id$v=19$m=65536...")).toBe(
			true,
		);
		expect(userService.isLegacyPasswordHash("$1$md5hash")).toBe(true);
		expect(userService.isLegacyPasswordHash("$2b$10$bcrypt...")).toBe(false);
	});

	it("should store and retrieve user settings", () => {
		const user = userService.createUser("settingsuser", "pass");
		expect(user.settings).toEqual({});

		const updated = userService.setUserSetting(
			"settingsuser",
			"action_map_delete",
			"replace_play",
		);
		expect(updated).toBe(true);

		const fetched = userService.getUserByUsername("settingsuser");
		expect(fetched?.settings.action_map_delete).toBe("replace_play");

		const allSettings = userService.getUserSettings("settingsuser");
		expect(allSettings?.settings.action_map_delete).toBe("replace_play");
		expect(allSettings?.effective.action_map_delete).toBe("replace_play");
	});

	it("should return false when setting configuration for non-existent user", () => {
		const result = userService.setUserSetting(
			"nonexistent",
			"action_map_delete",
			"none",
		);
		expect(result).toBe(false);
	});

	it("should resolve effective settings with config defaults", () => {
		const configService = new UserService(
			db,
			new Config({
				DEFAULT_USER_SETTINGS: JSON.stringify({
					action_map_delete: "prepend_play",
				}),
			}),
		);
		const user = configService.createUser("customuser", "pass");
		expect(user.settings).toEqual({});
		expect(user.effectiveSettings?.action_map_delete).toBe("prepend_play");

		const allSettings = configService.getUserSettings("customuser");
		expect(allSettings?.effective.action_map_delete).toBe("prepend_play");
	});
});
