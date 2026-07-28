import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { EpisodeService } from "../../services";
import type { User } from "../../types";
import type { ApiAuthenticator } from "./authenticator";
import { EpisodesApiRouter } from "./episodes-router";

describe("EpisodesApiRouter", () => {
	let authenticatorMock: ApiAuthenticator;
	let epServiceMock: EpisodeService;
	let router: EpisodesApiRouter;
	const mockUser: User = { id: 1, username: "alex", password_hash: "hash" };

	beforeEach(() => {
		authenticatorMock = {
			withAuth: mock((_req, _user, handler) => handler(mockUser)),
		} as unknown as ApiAuthenticator;

		epServiceMock = {
			getEpisodeActions: mock(() => []),
			saveEpisodeActions: mock(() => {}),
		} as unknown as EpisodeService;

		router = new EpisodesApiRouter(authenticatorMock, epServiceMock);
	});

	it("should return 404 for invalid parts", async () => {
		const req = new Request("http://localhost/api/2/episodes/alex/extra");
		const res = await router.handle(req, ["alex", "extra"]);
		expect(res.status).toBe(404);
	});

	it("should return episode actions on GET", async () => {
		const req = new Request(
			"http://localhost/api/2/episodes/alex.json?since=100",
			{ method: "GET" },
		);
		const res = await router.handle(req, ["alex.json"]);

		expect(res.status).toBe(200);
		expect(epServiceMock.getEpisodeActions).toHaveBeenCalledWith(1, 100, null);
	});

	it("should save episode actions on POST", async () => {
		const actions = [
			{
				podcast: "http://podcast.xml",
				episode: "http://ep1.mp3",
				action: "play",
				timestamp: 100,
			},
		];
		const req = new Request("http://localhost/api/2/episodes/alex.json", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(actions),
		});
		const res = await router.handle(req, ["alex.json"]);

		expect(res.status).toBe(200);
		expect(epServiceMock.saveEpisodeActions).toHaveBeenCalledWith(1, actions);
	});

	it("should return 400 when POST payload is not an array", async () => {
		const req = new Request("http://localhost/api/2/episodes/alex.json", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ not: "an array" }),
		});
		const res = await router.handle(req, ["alex.json"]);

		expect(res.status).toBe(400);
	});
});
