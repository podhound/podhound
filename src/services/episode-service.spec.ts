import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, it } from "bun:test";
import { runMigrations } from "../db/migrations";
import { EpisodeService } from "./episode-service";
import { UserService } from "./user-service";

describe("EpisodeService", () => {
	let db: Database;
	let epService: EpisodeService;
	let userId: number;

	beforeEach(() => {
		db = new Database(":memory:");
		runMigrations(db);
		const userService = new UserService(db);
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
		expect(typeof actions[0].timestamp).toBe("string");
		expect(actions[0].timestamp).toBe("1970-01-01T00:16:40.000Z");
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

	it("should process delete action as-is when action_map_delete is 'none'", () => {
		epService.saveEpisodeActions(
			userId,
			[{ podcast: "p1", episode: "e1", action: "delete", timestamp: 1000 }],
			{ action_map_delete: "none" },
		);

		const actions = epService.getEpisodeActions(userId, 0, null);
		expect(actions.length).toBe(1);
		expect(actions[0].action).toBe("delete");
	});

	it("should replace delete action with play when action_map_delete is 'replace_play'", () => {
		epService.saveEpisodeActions(
			userId,
			[
				{
					podcast: "p1",
					episode: "e1",
					action: "delete",
					total: 1800,
					timestamp: 1000,
				},
			],
			{ action_map_delete: "replace_play" },
		);

		const actions = epService.getEpisodeActions(userId, 0, null);
		expect(actions.length).toBe(1);
		expect(actions[0].action).toBe("play");
		expect(actions[0].position).toBe(1800);
	});

	it("should prepend play action before delete when action_map_delete is 'prepend_play'", () => {
		epService.saveEpisodeActions(
			userId,
			[
				{
					podcast: "p1",
					episode: "e1",
					action: "delete",
					total: 1800,
					timestamp: 1000,
				},
			],
			{ action_map_delete: "prepend_play" },
		);

		const actions = epService.getEpisodeActions(userId, 0, null);
		expect(actions.length).toBe(2);
		expect(actions[0].action).toBe("play");
		expect(actions[0].position).toBe(1800);
		expect(actions[1].action).toBe("delete");
	});
});
