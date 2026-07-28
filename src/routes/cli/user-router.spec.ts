import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { UserService } from "../../services";
import { UserCliRouter } from "./user-router";

describe("UserCliRouter", () => {
	let userServiceMock: UserService;
	let userRouter: UserCliRouter;
	let consoleLogSpy: ReturnType<typeof mock>;
	let consoleTableSpy: ReturnType<typeof mock>;

	beforeEach(() => {
		userServiceMock = {
			getAllUsers: mock(() => [{ id: 1, username: "testuser" }]),
			createUser: mock((username: string) => ({ id: 2, username })),
			updateUserPassword: mock(() => true),
		} as unknown as UserService;

		userRouter = new UserCliRouter(userServiceMock);

		consoleLogSpy = mock(() => {});
		consoleTableSpy = mock(() => {});
		console.log = consoleLogSpy;
		console.table = consoleTableSpy;
	});

	it("should create user", async () => {
		await userRouter.handle(["users", "create", "testuser", "pass123"]);
		expect(userServiceMock.createUser).toHaveBeenCalledWith(
			"testuser",
			"pass123",
		);
		expect(consoleLogSpy).toHaveBeenCalledWith("User 'testuser' created.");
	});

	it("should list users", async () => {
		await userRouter.handle(["users", "list"]);
		expect(userServiceMock.getAllUsers).toHaveBeenCalled();
		expect(consoleTableSpy).toHaveBeenCalledWith([
			{ id: 1, username: "testuser" },
		]);
	});

	it("should update user", async () => {
		await userRouter.handle(["users", "update", "testuser", "newpass"]);
		expect(userServiceMock.updateUserPassword).toHaveBeenCalledWith(
			"testuser",
			"newpass",
		);
		expect(consoleLogSpy).toHaveBeenCalledWith("User 'testuser' updated.");
	});

	it("should print usage when updating non-existent user", async () => {
		userServiceMock.updateUserPassword = mock(
			() => false,
		) as unknown as typeof userServiceMock.updateUserPassword;
		await userRouter.handle(["users", "update", "ghost", "newpass"]);
		expect(userServiceMock.updateUserPassword).toHaveBeenCalledWith(
			"ghost",
			"newpass",
		);
		expect(consoleLogSpy).toHaveBeenCalledWith("User 'ghost' not found.");
	});

	it.each([
		{ args: ["users", "unknown_action"] },
		{ args: ["users", "create", "only_user"] },
		{ args: ["users", "update", "only_user"] },
	])("should print usage on invalid action/args: $args", async ({ args }) => {
		await userRouter.handle(args);
		expect(consoleLogSpy).toHaveBeenCalledWith("Usage:");
	});
});
