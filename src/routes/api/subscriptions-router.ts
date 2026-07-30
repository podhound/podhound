import type { SubscriptionService } from "../../services";
import type { ApiSubRouter, User } from "../../types";
import type { ApiAuthenticator } from "./authenticator";

export class SubscriptionsApiRouter implements ApiSubRouter {
	public readonly domain = "subscriptions";

	constructor(
		private authenticator: ApiAuthenticator,
		private subscriptionService: SubscriptionService,
	) {}

	/**
	 * Main handler for the 'subscriptions' domain.
	 */
	public async handle(req: Request, parts: string[]): Promise<Response> {
		let username = "";
		if (parts.length === 1) {
			username = parts[0].replace(".json", "");
		} else if (parts.length === 2) {
			username = parts[0];
		} else {
			return Response.json({ error: "Not Found" }, { status: 404 });
		}

		const routes: Record<string, (user: User) => Promise<Response> | Response> =
			{
				GET: (user) => this.getSubscriptions(req, user),
				POST: (user) => this.updateSubscriptions(req, user),
				PUT: (user) => this.setSubscriptions(req, user),
			};

		const handler = routes[req.method];
		if (!handler) {
			return Response.json({ error: "Method Not Allowed" }, { status: 405 });
		}

		return this.authenticator.withAuth(req, username, handler);
	}

	/**
	 * Retrieves subscriptions for the authenticated user.
	 * If ?since parameter is present, returns gPodder delta object { add, remove, timestamp }.
	 * Otherwise returns array of URLs.
	 */
	public getSubscriptions(req: Request, user: User): Response {
		const url = new URL(req.url);
		const sinceParam = url.searchParams.get("since");
		const urls = this.subscriptionService.getSubscriptions(user.id);

		if (sinceParam !== null) {
			return Response.json({
				add: urls,
				remove: [],
				timestamp: Math.floor(Date.now() / 1000),
			});
		}

		return Response.json(urls);
	}

	/**
	 * Overwrites subscriptions with a full list for the authenticated user (PUT or POST array).
	 */
	public async setSubscriptions(req: Request, user: User): Promise<Response> {
		try {
			let urls: string[] = [];
			const text = await req.text();
			if (text.trim().startsWith("[")) {
				urls = JSON.parse(text) as string[];
			} else if (text.trim().startsWith("{")) {
				const body = JSON.parse(text) as { add?: string[]; urls?: string[] };
				urls = body.urls || body.add || [];
			} else {
				urls = text
					.split("\n")
					.map((s) => s.trim())
					.filter(Boolean);
			}

			if (Array.isArray(urls)) {
				this.subscriptionService.setSubscriptions(user.id, urls);
			}

			return Response.json({
				timestamp: Math.floor(Date.now() / 1000),
				update_urls: [],
			});
		} catch {
			return Response.json({ error: "Invalid payload" }, { status: 400 });
		}
	}

	/**
	 * Updates subscriptions (add/remove or full set) for the authenticated user.
	 */
	public async updateSubscriptions(
		req: Request,
		user: User,
	): Promise<Response> {
		try {
			const text = await req.text();
			if (text.trim().startsWith("[")) {
				const urls = JSON.parse(text) as string[];
				if (Array.isArray(urls)) {
					this.subscriptionService.setSubscriptions(user.id, urls);
					return Response.json({
						timestamp: Math.floor(Date.now() / 1000),
						update_urls: [],
					});
				}
			}

			const body = JSON.parse(text) as {
				add?: string[];
				remove?: string[];
			};

			this.subscriptionService.updateSubscriptions(
				user.id,
				body.add || [],
				body.remove || [],
			);

			return Response.json({
				timestamp: Math.floor(Date.now() / 1000),
				update_urls: [],
			});
		} catch {
			return Response.json({ error: "Invalid JSON body" }, { status: 400 });
		}
	}
}
