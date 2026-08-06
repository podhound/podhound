import { Config } from "./config";
import { createDatabase } from "./db";
import { Logger } from "./logger";
import { ApiRouter, CliRouter, HealthRouter } from "./routes";
import {
	AuthService,
	DeviceService,
	EpisodeService,
	SubscriptionService,
	UserService,
} from "./services";
import type { App } from "./types";

export function createApp(): App {
	const config = new Config();
	const logger = new Logger(config.logLevel);
	const db = createDatabase(config, logger);

	const userService = new UserService(db);
	const authService = new AuthService(userService, db, config);
	const subService = new SubscriptionService(db);
	const epService = new EpisodeService(db);
	const deviceService = new DeviceService(db);

	const api = new ApiRouter(
		authService,
		userService,
		config,
		subService,
		epService,
		deviceService,
	);
	const health = new HealthRouter();
	const cli = new CliRouter(userService);

	return { config, logger, api, cli, health };
}
