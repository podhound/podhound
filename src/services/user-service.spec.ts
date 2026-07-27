import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, it, spyOn } from "bun:test";
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
});
