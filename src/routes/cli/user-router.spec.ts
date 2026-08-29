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
			setUserSetting: mock(() => true),
			getUserSettings: mock((_username: string) => ({
				settings: { action_map_delete: "replace_play" },
				effective: { action_map_delete: "replace_play" },
			})),
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

	it("should get user settings", async () => {
		await userRouter.handle(["users", "get-settings", "testuser"]);
		expect(userServiceMock.getUserSettings).toHaveBeenCalledWith("testuser");
		expect(consoleLogSpy).toHaveBeenCalledWith("Settings for user 'testuser':");
		expect(consoleLogSpy).toHaveBeenCalledWith(
			JSON.stringify(
				{
					settings: { action_map_delete: "replace_play" },
					effective: { action_map_delete: "replace_play" },
				},
				null,
				2,
			),
		);
	});

	it("should print user not found when getting settings for non-existent user", async () => {
		userServiceMock.getUserSettings = mock(
			() => null,
		) as unknown as typeof userServiceMock.getUserSettings;
		await userRouter.handle(["users", "get-settings", "ghost"]);
		expect(userServiceMock.getUserSettings).toHaveBeenCalledWith("ghost");
		expect(consoleLogSpy).toHaveBeenCalledWith("User 'ghost' not found.");
	});

	it("should set user setting", async () => {
		await userRouter.handle([
			"users",
			"set-setting",
			"testuser",
			"action_map_delete",
			"replace_play",
		]);
		expect(userServiceMock.setUserSetting).toHaveBeenCalledWith(
			"testuser",
			"action_map_delete",
			"replace_play",
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"Setting 'action_map_delete' updated for user 'testuser'.",
		);
	});

	it("should print user not found when setting setting for non-existent user", async () => {
		userServiceMock.setUserSetting = mock(
			() => false,
		) as unknown as typeof userServiceMock.setUserSetting;
		await userRouter.handle([
			"users",
			"set-setting",
			"ghost",
			"action_map_delete",
			"replace_play",
		]);
		expect(userServiceMock.setUserSetting).toHaveBeenCalledWith(
			"ghost",
			"action_map_delete",
			"replace_play",
		);
		expect(consoleLogSpy).toHaveBeenCalledWith("User 'ghost' not found.");
	});

	it("should allow calling getSettings and setSetting directly", () => {
		userRouter.getSettings("testuser");
		expect(userServiceMock.getUserSettings).toHaveBeenCalledWith("testuser");

		userRouter.setSetting("testuser", "action_map_delete", "replace_play");
		expect(userServiceMock.setUserSetting).toHaveBeenCalledWith(
			"testuser",
			"action_map_delete",
			"replace_play",
		);
	});

	it.each([
		{ args: ["users", "unknown_action"] },
		{ args: ["users", "create", "only_user"] },
		{ args: ["users", "update", "only_user"] },
		{ args: ["users", "set-setting", "only_user"] },
		{ args: ["users", "set-setting", "user", "only_key"] },
		{ args: ["users", "get-settings"] },
	])("should print usage on invalid action/args: $args", async ({ args }) => {
		await userRouter.handle(args);
		expect(consoleLogSpy).toHaveBeenCalledWith("Usage:");
	});
});
