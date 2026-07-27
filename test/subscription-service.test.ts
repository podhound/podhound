import { describe, it, expect, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";
import { SubscriptionService, AuthService } from "../src/services";
import { runMigrations } from "../src/db/migrate";

describe("SubscriptionService", () => {
  let db: Database;
  let subService: SubscriptionService;
  let userId: number;

  beforeEach(() => {
    db = new Database(":memory:");
    runMigrations(db);
    const authService = new AuthService(db);
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
