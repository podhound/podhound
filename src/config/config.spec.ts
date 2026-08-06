import { describe, expect, it } from "bun:test";
import { Config } from "./config";

describe("Config Class", () => {
	it.each([
		{
			env: {},
			expectedPort: 8080,
			expectedPath: "data/podhound.db",
			expectedAutoReg: false,
		},
		{
			env: {
				PORT: "3000",
				DATABASE_PATH: "/custom/path.db",
				AUTO_REGISTER: "true",
			},
			expectedPort: 3000,
			expectedPath: "/custom/path.db",
			expectedAutoReg: true,
		},
		{
			env: { AUTO_REGISTER: "false" },
			expectedPort: 8080,
			expectedPath: "data/podhound.db",
			expectedAutoReg: false,
		},
	])(
		"should parse env $env correctly",
		({ env, expectedPort, expectedPath, expectedAutoReg }) => {
			const config = new Config(env);
			expect(config.port).toBe(expectedPort);
			expect(config.databasePath).toBe(expectedPath);
			expect(config.autoRegister).toBe(expectedAutoReg);
			expect(config.authCacheTtlMs).toBe(300_000);
			expect(config.sessionTtlSec).toBe(2_592_000);
			expect(config.gcIntervalMs).toBe(900_000);
			expect(config.rateLimitWindowMs).toBe(60_000);
			expect(config.rateLimitMaxAttempts).toBe(5);
		},
	);
});
