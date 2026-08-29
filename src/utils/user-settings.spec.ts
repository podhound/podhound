import { describe, expect, it } from "bun:test";
import {
	resolveUserSettings,
	SYSTEM_DEFAULT_USER_SETTINGS,
} from "./user-settings";

describe("resolveUserSettings", () => {
	it("should return system defaults when user and global settings are empty", () => {
		const result = resolveUserSettings(null, undefined);
		expect(result).toEqual(SYSTEM_DEFAULT_USER_SETTINGS);
		expect(result.action_map_delete).toBe("none");
	});

	it("should override system default with global default", () => {
		const result = resolveUserSettings(
			{},
			{ action_map_delete: "replace_play" },
		);
		expect(result.action_map_delete).toBe("replace_play");
	});

	it("should override global default with user setting", () => {
		const result = resolveUserSettings(
			{ action_map_delete: "prepend_play" },
			{ action_map_delete: "replace_play" },
		);
		expect(result.action_map_delete).toBe("prepend_play");
	});

	it("should ignore undefined properties in user settings and fall back to global default", () => {
		const result = resolveUserSettings(
			{ action_map_delete: undefined },
			{ action_map_delete: "replace_play" },
		);
		expect(result.action_map_delete).toBe("replace_play");
	});

	it("should ignore undefined properties in global defaults and fall back to system default", () => {
		const result = resolveUserSettings(
			{ action_map_delete: undefined },
			{ action_map_delete: undefined },
		);
		expect(result.action_map_delete).toBe("none");
	});
});
