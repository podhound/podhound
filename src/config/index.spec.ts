import { describe, expect, it } from "bun:test";
import { Config } from "./index";

describe("Config Class", () => {
	it("should use default values when env is empty", () => {
		const config = new Config({});
		expect(config.port).toBe(8080);
		expect(config.databasePath).toBe("data/podhound.db");
	});

	it("should parse values from env correctly", () => {
		const config = new Config({
			PORT: "3000",
			DATABASE_PATH: "/custom/path.db",
		});
		expect(config.port).toBe(3000);
		expect(config.databasePath).toBe("/custom/path.db");
	});
});
