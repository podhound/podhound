import type { Config } from "../config";
import type {
	AuthService,
	EpisodeService,
	SubscriptionService,
	UserService,
} from "../services";
import type { ApiSubRouter } from "../types";
import {
	ApiAuthenticator,
	AuthApiRouter,
	DevicesApiRouter,
	EpisodesApiRouter,
	SubscriptionsApiRouter,
} from "./api";

export class ApiRouter {
	private routers: ApiSubRouter[];

	constructor(
		authService: AuthService,
		userService: UserService,
		config: Config,
		subService: SubscriptionService,
		epService: EpisodeService,
	) {
		const authenticator = new ApiAuthenticator(
			authService,
			userService,
			config,
		);

		this.routers = [
			new AuthApiRouter(authenticator),
			new DevicesApiRouter(authenticator),
			new SubscriptionsApiRouter(authenticator, subService),
			new EpisodesApiRouter(authenticator, epService),
		];
	}

	/**
	 * Main entry point for the API routing.
	 * Dispatches requests to the appropriate sub-router based on the domain.
	 */
	public async handle(req: Request): Promise<Response | null> {
		const url = new URL(req.url);
		const pathParts = url.pathname.split("/").filter(Boolean);

		// Expecting path like /api/2/<domain>/...
		if (pathParts[0] !== "api" || pathParts[1] !== "2") {
			return null;
		}

		const domain = pathParts[2];
		const router = this.routers.find((r) => r.domain === domain);

		if (!router) {
			return null;
		}

		// Pass the remaining parts to the sub-router
		const remainingParts = pathParts.slice(3);
		return router.handle(req, remainingParts);
	}
}
