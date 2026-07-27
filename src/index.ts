import { Config } from "./config";
import { createDatabase } from "./db/client";
import { runMigrations } from "./db/migrate";
import { ApiRouter } from "./routes";
import { UserCliRouter } from "./routes/cli/user-router";
import { CliRouter } from "./routes/cli-router";
import {
	AuthService,
	EpisodeService,
	SubscriptionService,
	UserService,
} from "./services";

const config = new Config();
const db = createDatabase(config);

// Run SQLite migrations at startup
runMigrations(db);

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

const cli = new CliRouter([new UserCliRouter(userService)]);
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

		// Match /api/2/auth/<username>/login.json
		const authMatch = pathname.match(/^\/api\/2\/auth\/([^/]+)\/login\.json$/);
		if (authMatch) {
			const username = authMatch[1];
			return api.handleLogin(req, username);
		}

		// Match /api/2/devices/<username>.json or /api/2/devices/<username>/<device_id>.json
		const deviceMatch = pathname.match(
			/^\/api\/2\/devices\/([^/.]+)(?:\/[^/]+)?\.json$/,
		);
		if (deviceMatch) {
			const username = deviceMatch[1];
			return api.handleDevices(req, username);
		}

		// Match /api/2/subscriptions/<username>/<device>.json
		const subMatch = pathname.match(
			/^\/api\/2\/subscriptions\/([^/]+)\/([^/]+)\.json$/,
		);
		if (subMatch) {
			const username = subMatch[1];
			const device = subMatch[2];
			return api.handleSubscriptions(req, username, device);
		}

		// Match /api/2/episodes/<username>.json
		const episodeMatch = pathname.match(/^\/api\/2\/episodes\/([^/]+)\.json$/);
		if (episodeMatch) {
			const username = episodeMatch[1];
			return api.handleEpisodeActions(req, username);
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
