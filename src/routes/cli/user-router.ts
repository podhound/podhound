import type { UserService } from "../../services";
import type { CliSubRouter, UserSettings } from "../../types";

export class UserCliRouter implements CliSubRouter {
	public readonly slug = "users";

	constructor(private userService: UserService) {}

	/**
	 * Main handler for the 'users' domain. Dispatches to specific action handlers.
	 */
	public async handle(positionals: string[]): Promise<void> {
		const routes: Record<string, (positionals: string[]) => void> = {
			create: this.withArgs(2, ([, , username, password]) => {
				this.create(username, password);
			}),
			list: () => {
				this.list();
			},
			update: this.withArgs(2, ([, , username, newPassword]) => {
				this.update(username, newPassword);
			}),
			"set-setting": this.withArgs(3, ([, , username, key, value]) => {
				this.setSetting(username, key, value);
			}),
			"get-settings": this.withArgs(1, ([, , username]) => {
				this.getSettings(username);
			}),
		};

		const [, action] = positionals;
		const handler = routes[action];

		if (!handler) {
			this.printUsage();
			return;
		}

		handler(positionals);
	}

	/**
	 * Creates a new user with the specified username and password.
	 */
	public create(username: string, password_raw: string): void {
		this.userService.createUser(username, password_raw);
		console.log(`User '${username}' created.`);
	}

	/**
	 * Lists all users currently in the database.
	 */
	public list(): void {
		const users = this.userService.getAllUsers();
		console.table(users);
	}

	/**
	 * Updates the password for an existing user.
	 */
	public update(username: string, password_raw: string): void {
		if (!this.userService.updateUserPassword(username, password_raw)) {
			console.log(`User '${username}' not found.`);
			return;
		}
		console.log(`User '${username}' updated.`);
	}

	/**
	 * Sets a specific setting for a user.
	 */
	public setSetting(username: string, key: string, value: string): void {
		if (
			!this.userService.setUserSetting(
				username,
				key as keyof UserSettings,
				value,
			)
		) {
			console.log(`User '${username}' not found.`);
			return;
		}
		console.log(`Setting '${key}' updated for user '${username}'.`);
	}

	/**
	 * Retrieves and prints settings for a user.
	 */
	public getSettings(username: string): void {
		const userSettings = this.userService.getUserSettings(username);
		if (!userSettings) {
			console.log(`User '${username}' not found.`);
			return;
		}
		console.log(`Settings for user '${username}':`);
		console.log(JSON.stringify(userSettings, null, 2));
	}

	/**
	 * Prints usage instructions for the users CLI domain.
	 */
	public printUsage(): void {
		console.log("Usage:");
		console.log("  users create <username> <password>");
		console.log("  users list");
		console.log("  users update <username> <newpassword>");
		console.log("  users set-setting <username> <key> <value>");
		console.log("  users get-settings <username>");
	}

	/**
	 * Higher-order function to validate argument counts before invoking a handler.
	 */
	private withArgs(
		count: number,
		handler: (positionals: string[]) => void,
	): (positionals: string[]) => void {
		return (positionals: string[]) => {
			if (positionals.length < count + 2) {
				this.printUsage();
				return;
			}
			handler(positionals);
		};
	}
}
