import type { Config } from "../config";
import type { Logger } from "../logger";
import type { ApiRouter, CliRouter, HealthRouter } from "../routes";

export interface App {
	config: Config;
	logger: Logger;
	api: ApiRouter;
	cli: CliRouter;
	health: HealthRouter;
}
