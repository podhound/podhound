import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { User } from "../../types";
import { AuthApiRouter } from "./auth-router";
import type { ApiAuthenticator } from "./authenticator";

describe("AuthApiRouter", () => {
	let authenticatorMock: ApiAuthenticator;
	let router: AuthApiRouter;
	const mockUser: User = { id: 1, username: "alex", password_hash: "hash" };

	beforeEach(() => {
		authenticatorMock = {
			authenticateRequest: mock(() => null),
			authenticateOrRegister: mock(() => null),
		} as unknown as ApiAuthenticator;

		router = new AuthApiRouter(authenticatorMock);
	});

	it("should return 404 for invalid parts", async () => {
		const req = new Request("http://localhost/api/2/auth/login");
		const res = await router.handle(req, ["invalid"]);
		expect(res.status).toBe(404);
	});

	it("should authenticate and set cookie on successful login", async () => {
		authenticatorMock.authenticateRequest = mock(() => mockUser);

		const req = new Request("http://localhost/api/2/auth/alex/login.json", {
			method: "POST",
		});
		const res = await router.handle(req, ["alex", "login.json"]);

		expect(res.status).toBe(200);
		expect(res.headers.get("Set-Cookie")).toContain("session_user=alex");
		const data = (await res.json()) as { success: boolean };
		expect(data.success).toBe(true);
	});

	it("should authenticate via JSON body if request auth fails", async () => {
		authenticatorMock.authenticateRequest = mock(() => null);
		authenticatorMock.authenticateOrRegister = mock(() => mockUser);

		const req = new Request("http://localhost/api/2/auth/alex/login.json", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ password: "pass" }),
		});
		const res = await router.handle(req, ["alex", "login.json"]);

		expect(res.status).toBe(200);
		expect(authenticatorMock.authenticateOrRegister).toHaveBeenCalledWith(
			"alex",
			"pass",
		);
	});

	it("should return 401 when authentication fails", async () => {
		authenticatorMock.authenticateRequest = mock(() => null);

		const req = new Request("http://localhost/api/2/auth/alex/login.json", {
			method: "POST",
		});
		const res = await router.handle(req, ["alex", "login.json"]);

		expect(res.status).toBe(401);
	});
});
