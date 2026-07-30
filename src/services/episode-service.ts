import type { Database } from "bun:sqlite";
import type { EpisodeActionPayload } from "../types";

export class EpisodeService {
	constructor(private db: Database) {}

	private normalizeTimestamp(input?: number | string): number {
		if (typeof input === "number") {
			return input > 100000000000 ? Math.floor(input / 1000) : input;
		}
		if (typeof input === "string") {
			const parsed = Date.parse(input);
			if (!Number.isNaN(parsed)) {
				return Math.floor(parsed / 1000);
			}
			const num = Number(input);
			if (!Number.isNaN(num)) {
				return num > 100000000000 ? Math.floor(num / 1000) : num;
			}
		}
		return Math.floor(Date.now() / 1000);
	}

	public getEpisodeActions(
		userId: number,
		sinceTimestamp: number,
		podcastParam: string | null,
	): EpisodeActionPayload[] {
		let query =
			"SELECT podcast_url as podcast, episode_url as episode, action, position, total, timestamp, device, started, guid FROM episode_actions WHERE user_id = ? AND timestamp >= ?";
		const params: (string | number)[] = [userId, sinceTimestamp];

		if (podcastParam) {
			query += " AND podcast_url = ?";
			params.push(podcastParam);
		}

		query += " ORDER BY timestamp ASC";
		return this.db.prepare(query).all(...params) as EpisodeActionPayload[];
	}

	public saveEpisodeActions(
		userId: number,
		actions: EpisodeActionPayload[],
	): void {
		const nowTimestamp = Math.floor(Date.now() / 1000);
		this.db.transaction(() => {
			const stmt = this.db.prepare(`
        INSERT INTO episode_actions (user_id, podcast_url, episode_url, action, position, total, timestamp, device, started, guid)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

			for (const act of actions) {
				if (!act.podcast || !act.episode || !act.action) {
					continue;
				}
				stmt.run(
					userId,
					act.podcast,
					act.episode,
					act.action,
					act.position || 0,
					act.total || 0,
					act.timestamp ? this.normalizeTimestamp(act.timestamp) : nowTimestamp,
					act.device || null,
					act.started || 0,
					act.guid || null,
				);
			}
		})();
	}
}
