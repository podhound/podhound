import type { Config } from "../config";
import type { ApiRouter, CliRouter, HealthRouter } from "../routes";

export interface App {
	config: Config;
	api: ApiRouter;
	cli: CliRouter;
	health: HealthRouter;
}
