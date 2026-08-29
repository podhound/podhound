import type { UserSettings } from "../types";

export const SYSTEM_DEFAULT_USER_SETTINGS: Required<UserSettings> = {
	action_map_delete: "none",
};

function cleanSettings(settings?: UserSettings | null): Partial<UserSettings> {
	if (!settings) {
		return {};
	}
	const cleaned: Partial<UserSettings> = {};
	for (const [key, value] of Object.entries(settings)) {
		if (value !== undefined) {
			(cleaned as Record<string, unknown>)[key] = value;
		}
	}
	return cleaned;
}

export function resolveUserSettings(
	userSettings?: UserSettings | null,
	globalDefaults?: UserSettings,
): Required<UserSettings> {
	return {
		...SYSTEM_DEFAULT_USER_SETTINGS,
		...cleanSettings(globalDefaults),
		...cleanSettings(userSettings),
	};
}
