import type { User, UserService } from "./user-service";

export class AuthService {
	constructor(private userService: UserService) {}

	public authenticate(username: string, password_raw: string): User | null {
		const user = this.userService.getUserByUsername(username);
		if (!user) {
			return null;
		}

		const isValid = Bun.password.verifySync(password_raw, user.password_hash);
		if (!isValid) {
			return null;
		}

		return user;
	}
}
