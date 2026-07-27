import type { Database } from "bun:sqlite";

export interface EpisodeActionPayload {
	podcast: string;
	episode: string;
	action: string;
	timestamp?: number;
	position?: number;
	total?: number;
}

export class EpisodeService {
	constructor(private db: Database) {}

	public getEpisodeActions(
		userId: number,
		sinceTimestamp: number,
		podcastParam: string | null,
	): EpisodeActionPayload[] {
		let query =
			"SELECT podcast_url as podcast, episode_url as episode, action, position, total, timestamp FROM episode_actions WHERE user_id = ? AND timestamp >= ?";
		const params: (string | number)[] = [userId, sinceTimestamp];

		if (podcastParam) {
			query += " AND podcast_url = ?";
			params.push(podcastParam);
		}

		query += " ORDER BY timestamp ASC";
		return this.db.prepare(query).all(...params) as EpisodeActionPayload[];
	}

	public saveEpisodeActions(userId: number, actions: EpisodeActionPayload[]) {
		const nowTimestamp = Math.floor(Date.now() / 1000);
		this.db.transaction(() => {
			const stmt = this.db.prepare(`
        INSERT INTO episode_actions (user_id, podcast_url, episode_url, action, position, total, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

			for (const act of actions) {
				if (!act.podcast || !act.episode || !act.action) {
					continue;
				}
				const ts = act.timestamp || nowTimestamp;
				const pos = act.position || 0;
				const tot = act.total || 0;

				stmt.run(userId, act.podcast, act.episode, act.action, pos, tot, ts);
			}
		})();
	}
}
