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

	it.each([{ args: ["unknown_domain"] }, { args: [] }])(
		"should print available commands for unhandled input: $args",
		async ({ args }) => {
			const consoleSpy = mock(() => {});
			const originalLog = console.log;
			console.log = consoleSpy;

			try {
				await cliRouter.handle(args);
				expect(consoleSpy).toHaveBeenCalledWith("Available commands:");
			} finally {
				console.log = originalLog;
			}
		},
	);
});
