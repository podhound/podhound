import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { UserService } from "../services/user-service";
import { CliRouter } from "./cli-router";

describe("CliRouter", () => {
	let userServiceMock: UserService;
	let cliRouter: CliRouter;

	beforeEach(() => {
		userServiceMock = {
			getAllUsers: mock(() => [{ id: 1, username: "testuser" }]),
			createUser: mock((username: string) => ({ id: 2, username })),
			updateUserPassword: mock(() => true),
		} as unknown as UserService;

		cliRouter = new CliRouter(userServiceMock);
	});

	it("should create user", async () => {
		await cliRouter.handle(["users", "create", "testuser", "pass123"]);
		expect(userServiceMock.createUser).toHaveBeenCalledWith(
			"testuser",
			"pass123",
		);
	});

	it("should list users", async () => {
		await cliRouter.handle(["users", "list"]);
		expect(userServiceMock.getAllUsers).toHaveBeenCalled();
	});

	it("should update user", async () => {
		await cliRouter.handle(["users", "update", "testuser", "newpass"]);
		expect(userServiceMock.updateUserPassword).toHaveBeenCalledWith(
			"testuser",
			"newpass",
		);
	});

	it("should print usage instructions for unknown domain", async () => {
		const consoleSpy = mock(() => {});
		const originalLog = console.log;
		console.log = consoleSpy;

		try {
			await cliRouter.handle(["unknown_domain"]);
			expect(consoleSpy).toHaveBeenCalledWith("Usage:");
		} finally {
			console.log = originalLog;
		}
	});
});
