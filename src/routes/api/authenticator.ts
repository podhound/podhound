import type { Config } from "../../config";
import type { AuthService, UserService } from "../../services";
import type { User } from "../../types";
import { RateLimiter } from "../../utils";

export class ApiAuthenticator {
	private rateLimiter: RateLimiter;

	constructor(
		private authService: AuthService,
		private userService: UserService,
		private config: Config,
		rateLimiter?: RateLimiter,
	) {
		this.rateLimiter =
			rateLimiter ||
			new RateLimiter(config.rateLimitMaxAttempts, config.rateLimitWindowMs);
	}

	public getClientKey(req: Request): string {
		const forwarded = req.headers.get("x-forwarded-for");
		if (forwarded) {
			return forwarded.split(",")[0].trim();
		}
		const realIp = req.headers.get("x-real-ip");
		if (realIp) {
			return realIp;
		}
		return "client_ip";
	}

	public isRateLimited(req: Request): boolean {
		return this.rateLimiter.isRateLimited(this.getClientKey(req));
	}

	public recordFailedAttempt(req: Request): void {
		this.rateLimiter.recordAttempt(this.getClientKey(req));
	}

	public resetRateLimit(req: Request): void {
		this.rateLimiter.reset(this.getClientKey(req));
	}

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
	 * Authenticates an HTTP request using Basic Auth headers or session Cookie.
	 */
	public authenticateRequest(req: Request): User | null {
		if (this.isRateLimited(req)) {
			return null;
		}

		const authHeader = req.headers.get("authorization");
		if (authHeader?.startsWith("Basic ")) {
			try {
				const credentials = atob(authHeader.substring(6));
				const [username, password] = credentials.split(":");
				if (username && password) {
					const user = this.authenticateOrRegister(username, password);
					if (user) {
						this.resetRateLimit(req);
						return user;
					}
					this.recordFailedAttempt(req);
					return null;
				}
			} catch {
				this.recordFailedAttempt(req);
				return null;
			}
		}

		const cookieHeader = req.headers.get("cookie");
		if (cookieHeader) {
			const match =
				cookieHeader.match(/sessionid=([^;]+)/) ||
				cookieHeader.match(/session_user=([^;]+)/);
			if (match) {
				const sessionId = decodeURIComponent(match[1]);
				const user = this.authService.getUserBySessionId(sessionId);
				if (user) {
					return user;
				}
			}
		}

		return null;
	}

	/**
	 * HOF that enforces authentication before executing the provided handler.
	 */
	public withAuth(
		req: Request,
		expectedUsername: string,
		handler: (user: User) => Promise<Response> | Response,
	): Promise<Response> | Response {
		if (this.isRateLimited(req)) {
			return Response.json(
				{ error: "Too Many Requests" },
				{ status: 429, headers: { "Retry-After": "60" } },
			);
		}

		const user = this.authenticateRequest(req);
		if (!user || user.username !== expectedUsername) {
			return Response.json({ error: "Unauthorized" }, { status: 401 });
		}
		return handler(user);
	}
}
