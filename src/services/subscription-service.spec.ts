import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, it } from "bun:test";
import type { Config } from "../config";
import { runMigrations } from "../db/migrate";
import { AuthService } from "./auth-service";
import { SubscriptionService } from "./subscription-service";

describe("SubscriptionService", () => {
	let db: Database;
	let subService: SubscriptionService;
	let userId: number;

	beforeEach(() => {
		db = new Database(":memory:");
		runMigrations(db);
		const config = { autoRegister: true } as Config;
		const authService = new AuthService(db, config);
		const user = authService.getOrCreateUser("subuser", "pass");
		userId = user!.id;
		subService = new SubscriptionService(db);
	});

	it("should return empty list initially", () => {
		const subs = subService.getSubscriptions(userId);
		expect(subs).toEqual([]);
	});

	it("should add subscriptions correctly", () => {
		subService.updateSubscriptions(userId, ["url1", "url2"], []);
		const subs = subService.getSubscriptions(userId);
		expect(subs).toEqual(["url1", "url2"]);
	});

	it("should remove subscriptions correctly", () => {
		subService.updateSubscriptions(userId, ["url1", "url2", "url3"], []);
		subService.updateSubscriptions(userId, [], ["url2"]);
		const subs = subService.getSubscriptions(userId);
		expect(subs).toEqual(["url1", "url3"]);
	});
});
