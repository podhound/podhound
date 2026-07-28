import { Config } from "./config";
import { createDatabase } from "./db";
import { ApiRouter, CliRouter, HealthRouter } from "./routes";
import {
	AuthService,
	EpisodeService,
	SubscriptionService,
	UserService,
} from "./services";
import type { App } from "./types";

export function createApp(): App {
	const config = new Config();
	const db = createDatabase(config);

	const userService = new UserService(db);
	const authService = new AuthService(userService);
	const subService = new SubscriptionService(db);
	const epService = new EpisodeService(db);

	const api = new ApiRouter(
		authService,
		userService,
		config,
		subService,
		epService,
	);
	const health = new HealthRouter();
	const cli = new CliRouter(userService);

	return { config, api, cli, health };
}
