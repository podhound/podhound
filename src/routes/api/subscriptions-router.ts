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
			return Response.json({ error: "Not Found" }, { status: 404 });
		}

		const [username] = parts;

		const routes: Record<string, (user: User) => Promise<Response> | Response> =
			{
				GET: (user) => this.getSubscriptions(user),
				POST: (user) => this.updateSubscriptions(req, user),
			};

		const handler = routes[req.method];
		if (!handler) {
			return Response.json({ error: "Method Not Allowed" }, { status: 405 });
		}

		return this.authenticator.withAuth(req, username, handler);
	}

	/**
	 * Retrieves subscriptions for the authenticated user.
	 */
	public getSubscriptions(user: User): Response {
		const urls = this.subscriptionService.getSubscriptions(user.id);
		return Response.json(urls);
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
			return Response.json({
				timestamp: Math.floor(Date.now() / 1000),
				update_urls: [],
			});
		} catch {
			return Response.json({ error: "Invalid JSON body" }, { status: 400 });
		}
	}
}
