import { createApp } from "./bootstrap";

const { config, logger, api, cli, health } = createApp();
const args = process.argv.slice(2);

// If arguments are passed, run CLI mode and exit
if (args.length > 0) {
	process.exit(await cli.run(args));
}

const server = Bun.serve({
	port: config.port,
	async fetch(req: Request): Promise<Response> {
		const url = new URL(req.url);

		const healthResponse = health.handle(url.pathname);
		if (healthResponse) {
			return healthResponse;
		}

		const apiResponse = await api.handle(req);
		if (apiResponse) {
			return apiResponse;
		}

		return Response.json({ error: "Not Found" }, { status: 404 });
	},
});

logger.info(
	`[Podhound 🐶] Server is listening on http://localhost:${server.port}`,
);
