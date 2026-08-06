import type { Database, Statement } from "bun:sqlite";

export class SubscriptionService {
	private getSubscriptionsStmt: Statement;
	private deleteUserSubscriptionsStmt: Statement;
	private insertSubscriptionStmt: Statement;
	private deleteSingleSubscriptionStmt: Statement;

	constructor(private db: Database) {
		this.getSubscriptionsStmt = this.db.prepare(
			"SELECT podcast_url FROM subscriptions WHERE user_id = ?",
		);
		this.deleteUserSubscriptionsStmt = this.db.prepare(
			"DELETE FROM subscriptions WHERE user_id = ?",
		);
		this.insertSubscriptionStmt = this.db.prepare(
			"INSERT OR IGNORE INTO subscriptions (user_id, podcast_url) VALUES (?, ?)",
		);
		this.deleteSingleSubscriptionStmt = this.db.prepare(
			"DELETE FROM subscriptions WHERE user_id = ? AND podcast_url = ?",
		);
	}

	public getSubscriptions(userId: number): string[] {
		const rows = this.getSubscriptionsStmt.all(userId) as {
			podcast_url: string;
		}[];
		return rows.map((r) => r.podcast_url);
	}

	public setSubscriptions(userId: number, urls: string[]): void {
		this.db.transaction(() => {
			this.deleteUserSubscriptionsStmt.run(userId);
			for (const url of urls) {
				if (url) {
					this.insertSubscriptionStmt.run(userId, url);
				}
			}
		})();
	}

	public updateSubscriptions(
		userId: number,
		addList: string[],
		removeList: string[],
	): void {
		this.db.transaction(() => {
			for (const url of addList) {
				if (url) {
					this.insertSubscriptionStmt.run(userId, url);
				}
			}

			for (const url of removeList) {
				if (url) {
					this.deleteSingleSubscriptionStmt.run(userId, url);
				}
			}
		})();
	}
}
