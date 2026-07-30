import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { DeviceService } from "../../services";
import type { User } from "../../types";
import type { ApiAuthenticator } from "./authenticator";
import { DevicesApiRouter } from "./devices-router";

describe("DevicesApiRouter", () => {
	let authenticatorMock: ApiAuthenticator;
	let deviceServiceMock: DeviceService;
	let router: DevicesApiRouter;
	const mockUser: User = { id: 1, username: "alex", password_hash: "hash" };

	beforeEach(() => {
		authenticatorMock = {
			withAuth: mock((_req, _user, handler) => handler(mockUser)),
		} as unknown as ApiAuthenticator;

		deviceServiceMock = {
			getDevices: mock(() => [
				{
					id: "antennapod",
					caption: "AntennaPod",
					type: "phone",
					subscriptions: 0,
				},
			]),
			saveDevice: mock(() => {}),
		} as unknown as DeviceService;

		router = new DevicesApiRouter(authenticatorMock, deviceServiceMock);
	});

	it("should return 404 for invalid parts", async () => {
		const req = new Request("http://localhost/api/2/devices/alex/extra/part");
		const res = await router.handle(req, ["alex", "extra", "part"]);
		expect(res.status).toBe(404);
	});

	it("should return 405 for unsupported method", async () => {
		const req = new Request("http://localhost/api/2/devices/alex.json", {
			method: "DELETE",
		});
		const res = await router.handle(req, ["alex.json"]);
		expect(res.status).toBe(405);
	});

	it("should return devices list on GET", async () => {
		const req = new Request("http://localhost/api/2/devices/alex.json", {
			method: "GET",
		});
		const res = await router.handle(req, ["alex.json"]);

		expect(res.status).toBe(200);
		const data = (await res.json()) as { id: string }[];
		expect(data).toHaveLength(1);
		expect(data[0].id).toBe("antennapod");
	});

	it("should handle device update on POST", async () => {
		const req = new Request("http://localhost/api/2/devices/alex/phone.json", {
			method: "POST",
		});
		const res = await router.handle(req, ["alex", "phone.json"]);

		expect(res.status).toBe(200);
	});
});
