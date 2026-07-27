import { parseArgs } from "node:util";
import type { AuthService } from "../services/auth-service";

export class CliRouter {
	constructor(private authService: AuthService) {}

	public async handle(args: string[]): Promise<void> {
		const { positionals } = parseArgs({
			args,
			allowPositionals: true,
			strict: false,
		});

		if (positionals.length === 0) return;

		const domain = positionals[0];
		const action = positionals[1];

		if (domain === "users") {
			if (action === "create" && positionals.length >= 4) {
				this.authService.createUser(positionals[2], positionals[3]);
				console.log(`User '${positionals[2]}' created.`);
			} else if (action === "list") {
				const users = this.authService.getAllUsers();
				console.table(users);
			} else if (action === "update" && positionals.length >= 4) {
				const success = this.authService.updateUserPassword(
					positionals[2],
					positionals[3],
				);
				if (success) console.log(`User '${positionals[2]}' updated.`);
				else console.log(`User '${positionals[2]}' not found.`);
			} else {
				console.log("Usage:");
				console.log("  users create <username> <password>");
				console.log("  users list");
				console.log("  users update <username> <newpassword>");
			}
		} else {
			console.log("Usage:");
			console.log("  users create <username> <password>");
			console.log("  users list");
			console.log("  users update <username> <newpassword>");
		}
	}
}
