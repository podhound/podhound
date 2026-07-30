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
		let bodyContent = "";
		if (req.method === "POST" || req.method === "PUT") {
			try {
				bodyContent = await req.clone().text();
			} catch {}
		}
		logger.info(
			`[HTTP] ${req.method} ${url.pathname}${url.search}${bodyContent ? ` BODY: ${bodyContent}` : ""}`,
		);

		const healthResponse = health.handle(url.pathname);
		if (healthResponse) {
			return healthResponse;
		}

		const apiResponse = await api.handle(req);
		if (apiResponse) {
			logger.info(`[HTTP ${apiResponse.status}] ${req.method} ${url.pathname}`);
			return apiResponse;
		}

		logger.warn(`[HTTP 404] ${req.method} ${url.pathname}`);
		return Response.json({ error: "Not Found" }, { status: 404 });
	},
});

logger.info(
	`[Podhound 🐶] Server listening on http://localhost:${server.port}`,
);
