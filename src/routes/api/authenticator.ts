import type { Config } from "../../config";
import type { AuthService, UserService } from "../../services";
import type { User } from "../../types";

export class ApiAuthenticator {
	constructor(
		private authService: AuthService,
		private userService: UserService,
		private config: Config,
	) {}

	/**
	 * Attempts to authenticate a user. If auto-registration is enabled and
	 * the user does not exist, registers a new user instead.
	 */
	public authenticateOrRegister(
		username: string,
		password_raw: string,
	): User | null {
		let user = this.authService.authenticate(username, password_raw);
		if (!user && this.config.autoRegister) {
			if (!this.userService.getUserByUsername(username)) {
				user = this.userService.createUser(username, password_raw);
			}
		}
		return user;
	}

	/**
	 * Authenticates an HTTP request using Basic Auth headers.
	 */
	public authenticateRequest(req: Request): User | null {
		const authHeader = req.headers.get("authorization");
		if (!authHeader?.startsWith("Basic ")) {
			return null;
		}

		try {
			const credentials = atob(authHeader.substring(6));
			const [username, password] = credentials.split(":");
			if (!username || !password) {
				return null;
			}
			return this.authenticateOrRegister(username, password);
		} catch {
			return null;
		}
	}

	/**
	 * HOF that enforces authentication before executing the provided handler.
	 */
	public withAuth(
		req: Request,
		expectedUsername: string,
		handler: (user: User) => Promise<Response> | Response,
	): Promise<Response> | Response {
		const user = this.authenticateRequest(req);
		if (!user || user.username !== expectedUsername) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}
		return handler(user);
	}
}
