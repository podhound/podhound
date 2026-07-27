import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, it } from "bun:test";
import type { Config } from "../config";
import { runMigrations } from "../db/migrate";
import { AuthService } from "./auth-service";
import { EpisodeService } from "./episode-service";
import { UserService } from "./user-service";

describe("EpisodeService", () => {
	let db: Database;
	let epService: EpisodeService;
	let userId: number;

	beforeEach(() => {
		db = new Database(":memory:");
		runMigrations(db);
		const config = { autoRegister: true } as Config;
		const userService = new UserService(db);
		const authService = new AuthService(userService);
		const user = userService.createUser("epuser", "pass");
		userId = user?.id;
		epService = new EpisodeService(db);
	});

	it("should store and retrieve episode actions", () => {
		epService.saveEpisodeActions(userId, [
			{
				podcast: "p1",
				episode: "e1",
				action: "play",
				position: 10,
				total: 100,
				timestamp: 1000,
			},
		]);

		const actions = epService.getEpisodeActions(userId, 0, null);
		expect(actions.length).toBe(1);
		expect(actions[0].podcast).toBe("p1");
		expect(actions[0].episode).toBe("e1");
		expect(actions[0].position).toBe(10);
	});

	it("should filter by sinceTimestamp", () => {
		epService.saveEpisodeActions(userId, [
			{ podcast: "p1", episode: "e1", action: "play", timestamp: 1000 },
			{ podcast: "p1", episode: "e2", action: "play", timestamp: 2000 },
		]);

		const actions = epService.getEpisodeActions(userId, 1500, null);
		expect(actions.length).toBe(1);
		expect(actions[0].episode).toBe("e2");
	});

	it("should filter by podcast", () => {
		epService.saveEpisodeActions(userId, [
			{ podcast: "p1", episode: "e1", action: "play", timestamp: 1000 },
			{ podcast: "p2", episode: "e2", action: "play", timestamp: 1000 },
		]);

		const actions = epService.getEpisodeActions(userId, 0, "p2");
		expect(actions.length).toBe(1);
		expect(actions[0].podcast).toBe("p2");
	});
});
