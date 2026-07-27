import { User, AuthService, SubscriptionService, EpisodeService, EpisodeActionPayload } from "../services";

export class ApiRouter {
  constructor(
    private authService: AuthService,
    private subscriptionService: SubscriptionService,
    private episodeService: EpisodeService
  ) {}

  public authenticateRequest(req: Request): User | null {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Basic ")) return null;

    try {
      const credentials = atob(authHeader.substring(6));
      const [username, password] = credentials.split(":");
      if (!username || !password) return null;
      return this.authService.getOrCreateUser(username, password);
    } catch {
      return null;
    }
  }

  public async handleLogin(req: Request, urlUsername: string): Promise<Response> {
    let user = this.authenticateRequest(req);

    if (!user && req.method === "POST") {
      try {
        const body = await req.json() as { password?: string };
        if (body.password) {
          user = this.authService.getOrCreateUser(urlUsername, body.password);
        }
      } catch {}
    }

    if (!user || user.username !== urlUsername) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `session_user=${user.username}; Path=/; HttpOnly; SameSite=Lax`,
      },
    });
  }

  public handleDevices(req: Request, username: string): Response {
    const user = this.authenticateRequest(req);
    if (!user || user.username !== username) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      return new Response(
        JSON.stringify([
          { id: "antennapod", caption: "AntennaPod", type: "phone", subscriptions: 0 }
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response("OK", { status: 200 });
  }

  public async handleSubscriptions(req: Request, username: string, _device: string): Promise<Response> {
    const user = this.authenticateRequest(req);
    if (!user || user.username !== username) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    if (req.method === "GET") {
      const urls = this.subscriptionService.getSubscriptions(user.id);
      return new Response(JSON.stringify(urls), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (req.method === "POST") {
      try {
        const body = (await req.json()) as { add?: string[]; remove?: string[] };
        this.subscriptionService.updateSubscriptions(user.id, body.add || [], body.remove || []);
        return new Response(JSON.stringify({ timestamp: Math.floor(Date.now() / 1000), update_urls: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
    }

    return new Response("Method Not Allowed", { status: 405 });
  }

  public async handleEpisodeActions(req: Request, username: string): Promise<Response> {
    const user = this.authenticateRequest(req);
    if (!user || user.username !== username) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    const url = new URL(req.url);

    if (req.method === "GET") {
      const sinceParam = url.searchParams.get("since");
      const podcastParam = url.searchParams.get("podcast");
      const sinceTimestamp = sinceParam ? parseInt(sinceParam, 10) || 0 : 0;

      const actions = this.episodeService.getEpisodeActions(user.id, sinceTimestamp, podcastParam);
      return new Response(JSON.stringify({ actions, timestamp: Math.floor(Date.now() / 1000) }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (req.method === "POST") {
      try {
        const actions = (await req.json()) as EpisodeActionPayload[];
        if (!Array.isArray(actions)) {
          return new Response(JSON.stringify({ error: "Payload must be an array" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        this.episodeService.saveEpisodeActions(user.id, actions);
        return new Response(JSON.stringify({ timestamp: Math.floor(Date.now() / 1000), update_urls: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
    }

    return new Response("Method Not Allowed", { status: 405 });
  }
}
