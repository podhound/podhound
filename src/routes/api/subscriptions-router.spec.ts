import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { SubscriptionService } from "../../services";
import type { User } from "../../types";
import type { ApiAuthenticator } from "./authenticator";
import { SubscriptionsApiRouter } from "./subscriptions-router";

describe("SubscriptionsApiRouter", () => {
	let authenticatorMock: ApiAuthenticator;
	let subServiceMock: SubscriptionService;
	let router: SubscriptionsApiRouter;
	const mockUser: User = { id: 1, username: "alex", password_hash: "hash" };

	beforeEach(() => {
		authenticatorMock = {
			withAuth: mock((_req, _user, handler) => handler(mockUser)),
		} as unknown as ApiAuthenticator;

		subServiceMock = {
			getSubscriptions: mock(() => ["http://feed.xml"]),
			setSubscriptions: mock(() => {}),
			updateSubscriptions: mock(() => {}),
		} as unknown as SubscriptionService;

		router = new SubscriptionsApiRouter(authenticatorMock, subServiceMock);
	});

	it("should return 404 for invalid parts", async () => {
		const req = new Request(
			"http://localhost/api/2/subscriptions/alex/device/extra",
		);
		const res = await router.handle(req, ["alex", "device", "extra"]);
		expect(res.status).toBe(404);
	});

	it("should return subscriptions list on GET", async () => {
		const req = new Request(
			"http://localhost/api/2/subscriptions/alex/device.json",
			{ method: "GET" },
		);
		const res = await router.handle(req, ["alex", "device.json"]);

		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data).toEqual(["http://feed.xml"]);
	});

	it("should update subscriptions on POST", async () => {
		const req = new Request(
			"http://localhost/api/2/subscriptions/alex/device.json",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ add: ["http://new.xml"], remove: [] }),
			},
		);
		const res = await router.handle(req, ["alex", "device.json"]);

		expect(res.status).toBe(200);
		expect(subServiceMock.updateSubscriptions).toHaveBeenCalledWith(
			1,
			["http://new.xml"],
			[],
		);
	});

	it("should set subscriptions on PUT", async () => {
		const req = new Request(
			"http://localhost/api/2/subscriptions/alex/device.json",
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(["http://feed1.xml", "http://feed2.xml"]),
			},
		);
		const res = await router.handle(req, ["alex", "device.json"]);

		expect(res.status).toBe(200);
		expect(subServiceMock.setSubscriptions).toHaveBeenCalledWith(1, [
			"http://feed1.xml",
			"http://feed2.xml",
		]);
	});

	it("should return 400 on invalid JSON body", async () => {
		const req = new Request(
			"http://localhost/api/2/subscriptions/alex/device.json",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "invalid json",
			},
		);
		const res = await router.handle(req, ["alex", "device.json"]);

		expect(res.status).toBe(400);
	});
});
