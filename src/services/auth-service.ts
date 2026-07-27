import type { Config } from "../config";
import type { User, UserService } from "./user-service";

export class AuthService {
	constructor(
		private userService: UserService,
		private config: Config,
	) {}

	public getOrCreateUser(username: string, password?: string): User | null {
		const user = this.userService.getUserByUsername(username);

		if (!user) {
			if (!password) {
				return null;
			}
			if (!this.config.autoRegister) {
				return null; // Respect config
			}
			return this.userService.createUser(username, password);
		}

		if (password) {
			const isValid = Bun.password.verifySync(password, user.password_hash);
			if (!isValid) {
				return null;
			}
		}

		return user;
	}
}
