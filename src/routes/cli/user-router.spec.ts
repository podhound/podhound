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
		userServiceMock.updateUserPassword = mock(() => false) as any;
		await userRouter.handle(["users", "update", "ghost", "newpass"]);
		expect(userServiceMock.updateUserPassword).toHaveBeenCalledWith(
			"ghost",
			"newpass",
		);
		expect(consoleLogSpy).toHaveBeenCalledWith("User 'ghost' not found.");
	});

	it("should print usage on unknown action", async () => {
		await userRouter.handle(["users", "unknown_action"]);
		expect(consoleLogSpy).toHaveBeenCalledWith("Usage:");
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"  users create <username> <password>",
		);
	});

	it("should print usage when create is missing arguments", async () => {
		await userRouter.handle(["users", "create", "only_user"]);
		expect(userServiceMock.createUser).not.toHaveBeenCalled();
		expect(consoleLogSpy).toHaveBeenCalledWith("Usage:");
	});

	it("should print usage when update is missing arguments", async () => {
		await userRouter.handle(["users", "update", "only_user"]);
		expect(userServiceMock.updateUserPassword).not.toHaveBeenCalled();
		expect(consoleLogSpy).toHaveBeenCalledWith("Usage:");
	});
});
