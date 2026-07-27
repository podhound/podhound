import type { Database } from "bun:sqlite";

export class SubscriptionService {
	constructor(private db: Database) {}

	public getSubscriptions(userId: number): string[] {
		const rows = this.db
			.prepare("SELECT podcast_url FROM subscriptions WHERE user_id = ?")
			.all(userId) as { podcast_url: string }[];
		return rows.map((r) => r.podcast_url);
	}

	public updateSubscriptions(
		userId: number,
		addList: string[],
		removeList: string[],
	): void {
		this.db.transaction(() => {
			const insertStmt = this.db.prepare(
				"INSERT OR IGNORE INTO subscriptions (user_id, podcast_url) VALUES (?, ?)",
			);
			for (const url of addList) {
				if (url) {
					insertStmt.run(userId, url);
				}
			}

			const deleteStmt = this.db.prepare(
				"DELETE FROM subscriptions WHERE user_id = ? AND podcast_url = ?",
			);
			for (const url of removeList) {
				if (url) {
					deleteStmt.run(userId, url);
				}
			}
		})();
	}
}
