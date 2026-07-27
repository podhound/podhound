import { parseArgs } from "node:util";
import type { UserService } from "../services";
import type { CliSubRouter } from "../types";
import { UserCliRouter } from "./cli";

export class CliRouter {
	private routers: CliSubRouter[];

	constructor(userService: UserService) {
		this.routers = [new UserCliRouter(userService)];
	}
	/**
	 * Main CLI entry point. Parses arguments and routes to the appropriate domain handler.
	 */
	public async handle(args: string[]): Promise<void> {
		const { positionals } = parseArgs({
			args,
			allowPositionals: true,
			strict: false,
		});

		if (positionals.length === 0) {
			this.printUsage();
			return;
		}

		const [domain] = positionals;
		const router = this.routers.find((r) => r.slug === domain);

		if (!router) {
			this.printUsage();
			return;
		}

		await router.handle(positionals);
	}

	/**
	 * Prints usage instructions for all registered CLI domains.
	 */
	private printUsage(): void {
		console.log("Available commands:");
		for (const router of this.routers) {
			router.printUsage();
		}
	}
}
