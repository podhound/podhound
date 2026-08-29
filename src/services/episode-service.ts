import type { Database, Statement } from "bun:sqlite";
import type { EpisodeActionPayload, UserSettings } from "../types";
import { SYSTEM_DEFAULT_USER_SETTINGS } from "../utils";

export class EpisodeService {
	private getEpisodeActionsStmt: Statement;
	private getEpisodeActionsWithPodcastStmt: Statement;
	private insertEpisodeActionStmt: Statement;

	constructor(private db: Database) {
		this.getEpisodeActionsStmt = this.db.prepare(
			"SELECT podcast_url as podcast, episode_url as episode, action, position, total, timestamp, device, started, guid FROM episode_actions WHERE user_id = ? AND timestamp >= ? ORDER BY timestamp ASC",
		);
		this.getEpisodeActionsWithPodcastStmt = this.db.prepare(
			"SELECT podcast_url as podcast, episode_url as episode, action, position, total, timestamp, device, started, guid FROM episode_actions WHERE user_id = ? AND timestamp >= ? AND podcast_url = ? ORDER BY timestamp ASC",
		);
		this.insertEpisodeActionStmt = this.db.prepare(`
        INSERT INTO episode_actions (user_id, podcast_url, episode_url, action, position, total, timestamp, device, started, guid)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
	}

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
		const rows = (
			podcastParam
				? this.getEpisodeActionsWithPodcastStmt.all(
						userId,
						sinceTimestamp,
						podcastParam,
					)
				: this.getEpisodeActionsStmt.all(userId, sinceTimestamp)
		) as (Omit<EpisodeActionPayload, "timestamp"> & { timestamp: number })[];

		return rows.map((row) => ({
			...row,
			timestamp: new Date(row.timestamp * 1000).toISOString(),
		}));
	}

	public saveEpisodeActions(
		userId: number,
		actions: EpisodeActionPayload[],
		effectiveSettings: Required<UserSettings> = SYSTEM_DEFAULT_USER_SETTINGS,
	): void {
		const nowTimestamp = Math.floor(Date.now() / 1000);
		const actionMapDelete = effectiveSettings.action_map_delete;

		this.db.transaction(() => {
			for (const act of actions) {
				if (!act.podcast || !act.episode || !act.action) {
					continue;
				}

				const baseTimestamp = act.timestamp
					? this.normalizeTimestamp(act.timestamp)
					: nowTimestamp;

				if (act.action === "delete") {
					if (actionMapDelete === "replace_play") {
						const pos =
							act.total && act.total > 0
								? act.total
								: act.position && act.position > 0
									? act.position
									: 1;
						this.insertEpisodeActionStmt.run(
							userId,
							act.podcast,
							act.episode,
							"play",
							pos,
							act.total || pos,
							baseTimestamp,
							act.device || null,
							act.started || 0,
							act.guid || null,
						);
						continue;
					}

					if (actionMapDelete === "prepend_play") {
						const pos =
							act.total && act.total > 0
								? act.total
								: act.position && act.position > 0
									? act.position
									: 1;
						this.insertEpisodeActionStmt.run(
							userId,
							act.podcast,
							act.episode,
							"play",
							pos,
							act.total || pos,
							Math.max(0, baseTimestamp - 1),
							act.device || null,
							act.started || 0,
							act.guid || null,
						);
					}
				}

				this.insertEpisodeActionStmt.run(
					userId,
					act.podcast,
					act.episode,
					act.action,
					act.position || 0,
					act.total || 0,
					baseTimestamp,
					act.device || null,
					act.started || 0,
					act.guid || null,
				);
			}
		})();
	}
}
