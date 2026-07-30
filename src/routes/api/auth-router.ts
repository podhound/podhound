import type { AuthService } from "../../services";
import type { ApiSubRouter } from "../../types";
import type { ApiAuthenticator } from "./authenticator";

export class AuthApiRouter implements ApiSubRouter {
	public readonly domain = "auth";

	constructor(
		private authenticator: ApiAuthenticator,
		private authService: AuthService,
	) {}

	/**
	 * Main handler for the 'auth' domain.
	 */
	public async handle(req: Request, parts: string[]): Promise<Response> {
		const routes: Record<
			string,
			(username: string) => Promise<Response> | Response
		> = {
			"login.json": (username) => this.login(req, username),
		};

		if (parts.length === 2) {
			const [username, action] = parts;
			const handler = routes[action];
			if (handler) {
				return handler(username);
			}
		}

		return Response.json({ error: "Not Found" }, { status: 404 });
	}

	/**
	 * Handles login requests, managing session creation via cookies.
	 */
	private async login(req: Request, urlUsername: string): Promise<Response> {
		if (this.authenticator.isRateLimited(req)) {
			return Response.json(
				{ error: "Too Many Requests" },
				{ status: 429, headers: { "Retry-After": "60" } },
			);
		}

		let user = this.authenticator.authenticateRequest(req);

		if (!user && req.method === "POST") {
			try {
				const body = (await req.json()) as { password?: string };
				if (body.password) {
					user = this.authenticator.authenticateOrRegister(
						urlUsername,
						body.password,
					);
					if (user) {
						this.authenticator.resetRateLimit(req);
					} else {
						this.authenticator.recordFailedAttempt(req);
					}
				}
			} catch {}
		}

		if (!user || user.username !== urlUsername) {
			this.authenticator.recordFailedAttempt(req);
			return Response.json({ error: "Unauthorized" }, { status: 401 });
		}

		const sessionId = this.authService.createSession(user.id);

		return Response.json(
			{ success: true },
			{
				headers: {
					"Set-Cookie": `sessionid=${sessionId}; Path=/; HttpOnly; SameSite=Lax`,
				},
			},
		);
	}
}
