import { describe, expect, it } from "bun:test";
import { Config } from "../src/config";
import { createDatabase } from "../src/db";
import { ApiRouter } from "../src/routes";
import {
	AuthService,
	DeviceService,
	EpisodeService,
	SubscriptionService,
	UserService,
} from "../src/services";

const config = new Config({ DATABASE_PATH: ":memory:", AUTO_REGISTER: "true" });
const db = createDatabase(config);

const userService = new UserService(db);
const authService = new AuthService(userService, db);
const subService = new SubscriptionService(db);
const epService = new EpisodeService(db);
const deviceService = new DeviceService(db);

const api = new ApiRouter(
	authService,
	userService,
	config,
	subService,
	epService,
	deviceService,
);

describe("Podhound Core Tests", () => {
	it("should apply migrations and create tables", () => {
		const tables = db
			.prepare("SELECT name FROM sqlite_master WHERE type='table'")
			.all() as { name: string }[];
		const names = tables.map((t) => t.name);

		expect(names).toContain("users");
		expect(names).toContain("subscriptions");
		expect(names).toContain("episode_actions");
		expect(names).toContain("sessions");
		expect(names).toContain("devices");
		expect(names).toContain("_migrations");
	});

	it("should create and authenticate users", () => {
		const user1 = userService.createUser("testuser", "secret123");
		expect(user1).not.toBeNull();
		expect(user1?.username).toBe("testuser");

		// Authenticate with wrong password should fail
		const invalid = authService.authenticate("testuser", "wrongpassword");
		expect(invalid).toBeNull();

		// Authenticate with correct password should succeed
		const valid = authService.authenticate("testuser", "secret123");
		expect(valid).not.toBeNull();
		expect(valid?.id).toBe(user1?.id);
	});

	it("should manage subscriptions via handleSubscriptions", async () => {
		const basicAuth = btoa("subuser:password123");

		// Add subscription
		const addReq = new Request(
			"http://localhost/api/2/subscriptions/subuser/phone.json",
			{
				method: "POST",
				headers: {
					Authorization: `Basic ${basicAuth}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					add: ["https://feed.example.com/podcast.xml"],
					remove: [],
				}),
			},
		);

		const addRes = (await api.handle(addReq)) as Response;
		expect(addRes).not.toBeNull();
		expect(addRes.status).toBe(200);

		// List subscriptions
		const listReq = new Request(
			"http://localhost/api/2/subscriptions/subuser/phone.json",
			{
				method: "GET",
				headers: {
					Authorization: `Basic ${basicAuth}`,
				},
			},
		);

		const listRes = (await api.handle(listReq)) as Response;
		expect(listRes).not.toBeNull();
		expect(listRes.status).toBe(200);
		const listData = await listRes.json();
		expect(listData).toEqual(["https://feed.example.com/podcast.xml"]);
	});

	it("should record and query episode actions via episodes and inc-actions endpoints", async () => {
		const basicAuth = btoa("epuser:password123");

		// Send episode action
		const postReq = new Request("http://localhost/api/2/episodes/epuser.json", {
			method: "POST",
			headers: {
				Authorization: `Basic ${basicAuth}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify([
				{
					podcast: "https://feed.example.com/podcast.xml",
					episode: "https://feed.example.com/ep1.mp3",
					action: "play",
					position: 150,
					total: 1800,
					timestamp: "2024-01-01T12:00:00Z",
				},
			]),
		});

		const postRes = (await api.handle(postReq)) as Response;
		expect(postRes).not.toBeNull();
		expect(postRes.status).toBe(200);

		// Query episode actions via standard /api/2/inc-actions/<username>.json
		const getReq = new Request(
			"http://localhost/api/2/inc-actions/epuser.json?since=1600000000",
			{
				method: "GET",
				headers: {
					Authorization: `Basic ${basicAuth}`,
				},
			},
		);

		const getRes = (await api.handle(getReq)) as Response;
		expect(getRes).not.toBeNull();
		expect(getRes.status).toBe(200);
		const getData = (await getRes.json()) as { actions: unknown[] };
		expect(getData.actions.length).toBeGreaterThanOrEqual(1);
		expect(getData.actions[0].podcast).toBe(
			"https://feed.example.com/podcast.xml",
		);
		expect(getData.actions[0].position).toBe(150);
	});

	it("should register and list devices", async () => {
		const basicAuth = btoa("devuser:password123");

		// Register device
		const postReq = new Request(
			"http://localhost/api/2/devices/devuser/phone.json",
			{
				method: "POST",
				headers: {
					Authorization: `Basic ${basicAuth}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					caption: "My Phone",
					type: "phone",
				}),
			},
		);

		const postRes = (await api.handle(postReq)) as Response;
		expect(postRes.status).toBe(200);

		// Get devices list
		const getReq = new Request("http://localhost/api/2/devices/devuser.json", {
			method: "GET",
			headers: {
				Authorization: `Basic ${basicAuth}`,
			},
		});

		const getRes = (await api.handle(getReq)) as Response;
		expect(getRes.status).toBe(200);
		const devices = (await getRes.json()) as { id: string; caption: string }[];
		expect(devices).toHaveLength(1);
		expect(devices[0].id).toBe("phone");
		expect(devices[0].caption).toBe("My Phone");
	});
});
