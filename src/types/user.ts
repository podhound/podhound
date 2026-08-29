export type ActionMapDeleteOption = "none" | "replace_play" | "prepend_play";

export interface UserSettings {
	action_map_delete?: ActionMapDeleteOption;
}

export interface User {
	id: number;
	username: string;
	password_hash: string;
	settings: UserSettings;
	effectiveSettings?: Required<UserSettings>;
}
