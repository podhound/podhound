import { beforeEach, describe, expect, it } from "bun:test";
import { RateLimiter } from "./rate-limiter";

describe("RateLimiter", () => {
	let limiter: RateLimiter;

	beforeEach(() => {
		limiter = new RateLimiter(3, 1000); // 3 attempts per 1 second
	});

	it("should allow attempts below threshold", () => {
		expect(limiter.isRateLimited("ip1")).toBe(false);
		limiter.recordAttempt("ip1");
		expect(limiter.isRateLimited("ip1")).toBe(false);
		limiter.recordAttempt("ip1");
		expect(limiter.isRateLimited("ip1")).toBe(false);
	});

	it("should block attempts exceeding threshold", () => {
		limiter.recordAttempt("ip1");
		limiter.recordAttempt("ip1");
		limiter.recordAttempt("ip1");
		expect(limiter.isRateLimited("ip1")).toBe(true);
	});

	it("should reset after window expires", async () => {
		limiter.recordAttempt("ip1");
		limiter.recordAttempt("ip1");
		limiter.recordAttempt("ip1");
		expect(limiter.isRateLimited("ip1")).toBe(true);

		await new Promise((resolve) => setTimeout(resolve, 1100));
		expect(limiter.isRateLimited("ip1")).toBe(false);
	});

	it("should clear attempts on manual reset", () => {
		limiter.recordAttempt("ip1");
		limiter.recordAttempt("ip1");
		limiter.recordAttempt("ip1");
		expect(limiter.isRateLimited("ip1")).toBe(true);

		limiter.reset("ip1");
		expect(limiter.isRateLimited("ip1")).toBe(false);
	});
});
