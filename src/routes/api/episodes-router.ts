import type { EpisodeService } from "../../services";
import type { ApiSubRouter, EpisodeActionPayload, User } from "../../types";
import type { ApiAuthenticator } from "./authenticator";

export class EpisodesApiRouter implements ApiSubRouter {
	public readonly domain = "episodes";

	constructor(
		private authenticator: ApiAuthenticator,
		private episodeService: EpisodeService,
	) {}

	/**
	 * Main handler for the 'episodes' domain.
	 */
	public async handle(req: Request, parts: string[]): Promise<Response> {
		if (parts.length !== 1) {
			return Response.json({ error: "Not Found" }, { status: 404 });
		}

		const username = parts[0].replace(".json", "");

		const routes: Record<string, (user: User) => Promise<Response> | Response> =
			{
				GET: (user) => this.getEpisodes(req, user),
				POST: (user) => this.updateEpisodes(req, user),
			};

		const handler = routes[req.method];
		if (!handler) {
			return Response.json({ error: "Method Not Allowed" }, { status: 405 });
		}

		return this.authenticator.withAuth(req, username, handler);
	}

	/**
	 * Retrieves episode actions for the authenticated user since a given timestamp.
	 */
	private getEpisodes(req: Request, user: User): Response {
		const url = new URL(req.url);
		const sinceTimestamp = Number(url.searchParams.get("since")) || 0;
		const podcastParam = url.searchParams.get("podcast");

		const actions = this.episodeService.getEpisodeActions(
			user.id,
			sinceTimestamp,
			podcastParam,
		);

		return Response.json({
			actions,
			timestamp: Math.floor(Date.now() / 1000),
		});
	}

	/**
	 * Saves a list of episode actions for the authenticated user.
	 */
	private async updateEpisodes(req: Request, user: User): Promise<Response> {
		try {
			const actions = (await req.json()) as EpisodeActionPayload[];
			if (!Array.isArray(actions)) {
				return Response.json(
					{ error: "Payload must be an array" },
					{ status: 400 },
				);
			}

			this.episodeService.saveEpisodeActions(user.id, actions);
			return Response.json({
				timestamp: Math.floor(Date.now() / 1000),
				update_urls: [],
			});
		} catch {
			return Response.json({ error: "Invalid JSON body" }, { status: 400 });
		}
	}
}
