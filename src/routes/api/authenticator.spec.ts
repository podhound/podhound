import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { Config } from "../../config";
import type { AuthService, UserService } from "../../services";
import type { User } from "../../types";
import { ApiAuthenticator } from "./authenticator";

describe("ApiAuthenticator", () => {
	let authServiceMock: AuthService;
	let userServiceMock: UserService;
	let configMock: Config;
	let authenticator: ApiAuthenticator;
	const mockUser: User = { id: 1, username: "alex", password_hash: "hash" };

	beforeEach(() => {
		authServiceMock = {
			authenticate: mock(() => null),
			getUserBySessionId: mock(() => null),
			createSession: mock(() => "mock-session-id"),
		} as unknown as AuthService;

		userServiceMock = {
			getUserByUsername: mock(() => null),
			createUser: mock(() => mockUser),
		} as unknown as UserService;

		configMock = {
			autoRegister: false,
		} as unknown as Config;

		authenticator = new ApiAuthenticator(
			authServiceMock,
			userServiceMock,
			configMock,
		);
	});

	it.each([{ header: null }, { header: "Bearer token" }, { header: "Basic " }])(
		"should return null if Basic auth header is missing or malformed: $header",
		({ header }) => {
			const headers = header ? { Authorization: header } : {};
			const req = new Request("http://localhost", { headers });
			expect(authenticator.authenticateRequest(req)).toBeNull();
		},
	);

	it("should authenticate with valid Basic auth header", () => {
		authServiceMock.authenticate = mock(() => mockUser);
		const credentials = btoa("alex:secret");
		const req = new Request("http://localhost", {
			headers: { Authorization: `Basic ${credentials}` },
		});

		const user = authenticator.authenticateRequest(req);
		expect(user).toEqual(mockUser);
		expect(authServiceMock.authenticate).toHaveBeenCalledWith("alex", "secret");
	});

	it("should auto-register new user if enabled and user is missing", () => {
		(configMock as { autoRegister: boolean }).autoRegister = true;
		const credentials = btoa("newuser:secret");
		const req = new Request("http://localhost", {
			headers: { Authorization: `Basic ${credentials}` },
		});

		const user = authenticator.authenticateRequest(req);
		expect(user).toEqual(mockUser);
		expect(userServiceMock.createUser).toHaveBeenCalledWith(
			"newuser",
			"secret",
		);
	});

	it("should authenticate with session Cookie", () => {
		authServiceMock.getUserBySessionId = mock(() => mockUser);
		const req = new Request("http://localhost", {
			headers: { Cookie: "sessionid=mock-session-id" },
		});

		const user = authenticator.authenticateRequest(req);
		expect(user).toEqual(mockUser);
		expect(authServiceMock.getUserBySessionId).toHaveBeenCalledWith(
			"mock-session-id",
		);
	});

	it("should return 401 response in withAuth if authentication fails", async () => {
		const req = new Request("http://localhost");
		const handler = mock(() => new Response("OK"));

		const res = await authenticator.withAuth(req, "alex", handler);
		expect(res.status).toBe(401);
		expect(handler).not.toHaveBeenCalled();
	});
});
