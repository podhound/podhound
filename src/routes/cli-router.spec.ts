import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { AuthService } from "../services/auth-service";
import { CliRouter } from "./cli-router";

describe("CliRouter", () => {
	let authServiceMock: AuthService;
	let cliRouter: CliRouter;

	beforeEach(() => {
		authServiceMock = {
			createUser: mock(() => ({ id: 1, username: "test", password_hash: "" })),
			getAllUsers: mock(() => [{ id: 1, username: "test" }]),
			updateUserPassword: mock(() => true),
		} as unknown as AuthService;
		cliRouter = new CliRouter(authServiceMock);
	});

	it("should create user", async () => {
		await cliRouter.handle(["users", "create", "testuser", "pass123"]);
		expect(authServiceMock.createUser).toHaveBeenCalledWith(
			"testuser",
			"pass123",
		);
	});

	it("should list users", async () => {
		await cliRouter.handle(["users", "list"]);
		expect(authServiceMock.getAllUsers).toHaveBeenCalled();
	});

	it("should update user", async () => {
		await cliRouter.handle(["users", "update", "testuser", "newpass"]);
		expect(authServiceMock.updateUserPassword).toHaveBeenCalledWith(
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
