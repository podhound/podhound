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
		if (parts.length !== 2) {
			return new Response(JSON.stringify({ error: "Not Found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		const [username] = parts;

		const routes: Record<string, (user: User) => Promise<Response> | Response> =
			{
				GET: (user) => this.getSubscriptions(user),
				POST: (user) => this.updateSubscriptions(req, user),
			};

		const handler = routes[req.method];
		if (!handler) {
			return new Response("Method Not Allowed", { status: 405 });
		}

		return this.authenticator.withAuth(req, username, handler);
	}

	/**
	 * Retrieves subscriptions for the authenticated user.
	 */
	public getSubscriptions(user: User): Response {
		const urls = this.subscriptionService.getSubscriptions(user.id);
		return new Response(JSON.stringify(urls), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}

	/**
	 * Updates subscriptions (add/remove) for the authenticated user.
	 */
	public async updateSubscriptions(
		req: Request,
		user: User,
	): Promise<Response> {
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
}
