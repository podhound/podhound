import { Config } from "./config";
import { createDatabase } from "./db";
import { ApiRouter, CliRouter } from "./routes";
import {
	AuthService,
	EpisodeService,
	SubscriptionService,
	UserService,
} from "./services";

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

const cli = new CliRouter(userService);
const args = process.argv.slice(2);

// If arguments are passed, run CLI mode and exit
if (args.length > 0) {
	try {
		await cli.handle(args);
		process.exit(0);
	} catch (e: unknown) {
		if (e instanceof Error) {
			console.error(e.message);
		} else {
			console.error(e);
		}
		process.exit(1);
	}
}

const server = Bun.serve({
	port: config.port,
	async fetch(req: Request): Promise<Response> {
		const url = new URL(req.url);
		const pathname = url.pathname;

		// Health check / Info root endpoint
		if (pathname === "/" || pathname === "/health") {
			return new Response(
				JSON.stringify({
					service: "Podhound",
					status: "healthy",
					gpodder_api: "v2",
				}),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const apiResponse = await api.handle(req);
		if (apiResponse) {
			return apiResponse;
		}

		return new Response(JSON.stringify({ error: "Not Found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	},
});

console.log(
	`[Podhound 🐶] Server is listening on http://localhost:${server.port}`,
);
