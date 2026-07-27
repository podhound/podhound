import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { UserService } from "../services";
import { CliRouter } from "./cli-router";

describe("CliRouter", () => {
	let userServiceMock: UserService;
	let cliRouter: CliRouter;

	beforeEach(() => {
		userServiceMock = {
			getAllUsers: mock(() => []),
			createUser: mock(() => ({ id: 2, username: "test" })),
			updateUserPassword: mock(() => true),
			getUserByUsername: mock(() => null),
		} as unknown as UserService;

		cliRouter = new CliRouter(userServiceMock);
	});

	it("should delegate to user sub-router", async () => {
		const consoleSpy = mock(() => {});
		const originalLog = console.log;
		console.log = consoleSpy;

		try {
			await cliRouter.handle(["users", "unknown"]);
			expect(consoleSpy).toHaveBeenCalledWith("Usage:");
		} finally {
			console.log = originalLog;
		}
	});

	it("should print usage instructions for unknown domain", async () => {
		const consoleSpy = mock(() => {});
		const originalLog = console.log;
		console.log = consoleSpy;

		try {
			await cliRouter.handle(["unknown_domain"]);
			expect(consoleSpy).toHaveBeenCalledWith("Available commands:");
		} finally {
			console.log = originalLog;
		}
	});

	it("should print usage instructions if no arguments provided", async () => {
		const consoleSpy = mock(() => {});
		const originalLog = console.log;
		console.log = consoleSpy;

		try {
			await cliRouter.handle([]);
			expect(consoleSpy).toHaveBeenCalledWith("Available commands:");
		} finally {
			console.log = originalLog;
		}
	});
});
