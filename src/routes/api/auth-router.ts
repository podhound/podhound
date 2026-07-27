import type { ApiSubRouter } from "../../types";
import type { ApiAuthenticator } from "./authenticator";

export class AuthApiRouter implements ApiSubRouter {
	public readonly domain = "auth";

	constructor(private authenticator: ApiAuthenticator) {}

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

		return new Response(JSON.stringify({ error: "Not Found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	/**
	 * Handles login requests, managing session creation via cookies.
	 */
	private async login(req: Request, urlUsername: string): Promise<Response> {
		let user = this.authenticator.authenticateRequest(req);

		if (!user && req.method === "POST") {
			try {
				const body = (await req.json()) as { password?: string };
				if (body.password) {
					user = this.authenticator.authenticateOrRegister(
						urlUsername,
						body.password,
					);
				}
			} catch {}
		}

		if (!user || user.username !== urlUsername) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Set-Cookie": `session_user=${user.username}; Path=/; HttpOnly; SameSite=Lax`,
			},
		});
	}
}
