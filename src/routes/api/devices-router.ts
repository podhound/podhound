import type { ApiSubRouter, User } from "../../types";
import type { ApiAuthenticator } from "./authenticator";

export class DevicesApiRouter implements ApiSubRouter {
	public readonly domain = "devices";

	constructor(private authenticator: ApiAuthenticator) {}

	/**
	 * Main handler for the 'devices' domain.
	 */
	public async handle(req: Request, parts: string[]): Promise<Response> {
		let username = "";
		if (parts.length === 1) {
			username = parts[0].replace(".json", "");
		} else if (parts.length === 2) {
			username = parts[0];
		} else {
			return new Response(JSON.stringify({ error: "Not Found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		const routes: Record<string, (user: User) => Response> = {
			GET: () => this.getDevices(),
			POST: () => this.updateDevice(),
		};

		const handler = routes[req.method];
		if (!handler) {
			return new Response("Method Not Allowed", { status: 405 });
		}

		return this.authenticator.withAuth(req, username, handler);
	}

	/**
	 * Retrieves the devices for the authenticated user.
	 */
	private getDevices(): Response {
		return new Response(
			JSON.stringify([
				{
					id: "antennapod",
					caption: "AntennaPod",
					type: "phone",
					subscriptions: 0,
				},
			]),
			{ status: 200, headers: { "Content-Type": "application/json" } },
		);
	}

	/**
	 * Updates a device for the authenticated user.
	 */
	private updateDevice(): Response {
		return new Response("OK", { status: 200 });
	}
}
