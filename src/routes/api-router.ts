import type { Config } from "../config";
import type {
	AuthService,
	EpisodeService,
	SubscriptionService,
	UserService,
} from "../services";
import type { EpisodeActionPayload, User } from "../types";

export class ApiRouter {
	constructor(
		private authService: AuthService,
		private userService: UserService,
		private config: Config,
		private subscriptionService: SubscriptionService,
		private episodeService: EpisodeService,
	) {}

	/**
	 * Attempts to authenticate a user. If auto-registration is enabled and
	 * the user does not exist, registers a new user instead.
	 */
	private authenticateOrRegister(
		username: string,
		password_raw: string,
	): User | null {
		let user = this.authService.authenticate(username, password_raw);
		if (!user && this.config.autoRegister) {
			if (!this.userService.getUserByUsername(username)) {
				user = this.userService.createUser(username, password_raw);
			}
		}
		return user;
	}

	/**
	 * Authenticates an HTTP request using Basic Auth headers.
	 */
	public authenticateRequest(req: Request): User | null {
		const authHeader = req.headers.get("authorization");
		if (!authHeader?.startsWith("Basic ")) {
			return null;
		}

		try {
			const credentials = atob(authHeader.substring(6));
			const [username, password] = credentials.split(":");
			if (!username || !password) {
				return null;
			}
			return this.authenticateOrRegister(username, password);
		} catch {
			return null;
		}
	}

	/**
	 * Handles login requests, managing session creation via cookies.
	 */
	public async handleLogin(
		req: Request,
		urlUsername: string,
	): Promise<Response> {
		let user = this.authenticateRequest(req);

		if (!user && req.method === "POST") {
			try {
				const body = (await req.json()) as { password?: string };
				if (body.password) {
					user = this.authenticateOrRegister(urlUsername, body.password);
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

	/**
	 * Handles device-related requests for a user (e.g. syncing client metadata).
	 */
	public handleDevices(req: Request, username: string): Response {
		const user = this.authenticateRequest(req);
		if (!user || user.username !== username) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (req.method === "GET") {
			return new Response(
				JSON.stringify([
					{
						id: "antennapod",
						caption: "AntennaPod",
						type: "phone",
						subscriptions: 0,
					},
				]),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			);
		}

		return new Response("OK", { status: 200 });
	}

	/**
	 * Handles podcast subscription updates and retrieval for a user.
	 */
	public async handleSubscriptions(
		req: Request,
		username: string,
		_device: string,
	): Promise<Response> {
		const user = this.authenticateRequest(req);
		if (!user || user.username !== username) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (req.method === "GET") {
			const urls = this.subscriptionService.getSubscriptions(user.id);
			return new Response(JSON.stringify(urls), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (req.method === "POST") {
			try {
				const body = (await req.json()) as {
					add?: string[];
					remove?: string[];
				};
				this.subscriptionService.updateSubscriptions(
					user.id,
					body.add || [],
					body.remove || [],
				);
				return new Response(
					JSON.stringify({
						timestamp: Math.floor(Date.now() / 1000),
						update_urls: [],
					}),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				);
			} catch {
				return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
					status: 400,
					headers: { "Content-Type": "application/json" },
				});
			}
		}

		return new Response("Method Not Allowed", { status: 405 });
	}

	/**
	 * Handles recording and fetching episode playback actions (play, pause, etc.).
	 */
	public async handleEpisodeActions(
		req: Request,
		username: string,
	): Promise<Response> {
		const user = this.authenticateRequest(req);
		if (!user || user.username !== username) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const url = new URL(req.url);

		if (req.method === "GET") {
			const sinceParam = url.searchParams.get("since");
			const podcastParam = url.searchParams.get("podcast");
			const sinceTimestamp = sinceParam ? parseInt(sinceParam, 10) || 0 : 0;

			const actions = this.episodeService.getEpisodeActions(
				user.id,
				sinceTimestamp,
				podcastParam,
			);
			return new Response(
				JSON.stringify({ actions, timestamp: Math.floor(Date.now() / 1000) }),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			);
		}

		if (req.method === "POST") {
			try {
				const actions = (await req.json()) as EpisodeActionPayload[];
				if (!Array.isArray(actions)) {
					return new Response(
						JSON.stringify({ error: "Payload must be an array" }),
						{ status: 400, headers: { "Content-Type": "application/json" } },
					);
				}

				this.episodeService.saveEpisodeActions(user.id, actions);
				return new Response(
					JSON.stringify({
						timestamp: Math.floor(Date.now() / 1000),
						update_urls: [],
					}),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				);
			} catch {
				return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
					status: 400,
					headers: { "Content-Type": "application/json" },
				});
			}
		}

		return new Response("Method Not Allowed", { status: 405 });
	}
}
