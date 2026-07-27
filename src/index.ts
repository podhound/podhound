import { runMigrations } from "./db/migrate";
import { ApiRouter } from "./routes";
import { AuthService, SubscriptionService, EpisodeService } from "./services";
import { createDatabase } from "./db/client";
import { Config } from "./config";

const config = new Config();
const db = createDatabase(config);

// Run SQLite migrations at startup
runMigrations(db);

const authService = new AuthService(db);
const subService = new SubscriptionService(db);
const epService = new EpisodeService(db);
const api = new ApiRouter(authService, subService, epService);

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
        }
      );
    }

    // Match /api/2/auth/<username>/login.json
    const authMatch = pathname.match(/^\/api\/2\/auth\/([^/]+)\/login\.json$/);
    if (authMatch) {
      const username = authMatch[1];
      return api.handleLogin(req, username);
    }

    // Match /api/2/devices/<username>.json or /api/2/devices/<username>/<device_id>.json
    const deviceMatch = pathname.match(/^\/api\/2\/devices\/([^/.]+)(?:\/[^/]+)?\.json$/);
    if (deviceMatch) {
      const username = deviceMatch[1];
      return api.handleDevices(req, username);
    }

    // Match /api/2/subscriptions/<username>/<device>.json
    const subMatch = pathname.match(/^\/api\/2\/subscriptions\/([^/]+)\/([^/]+)\.json$/);
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

console.log(`[Podhound 🐶] Server is listening on http://localhost:${server.port}`);
