import type { DeviceService } from "../../services";
import type { ApiSubRouter, User } from "../../types";
import type { ApiAuthenticator } from "./authenticator";

export class DevicesApiRouter implements ApiSubRouter {
	public readonly domain = "devices";

	constructor(
		private authenticator: ApiAuthenticator,
		private deviceService: DeviceService,
	) {}

	/**
	 * Main handler for the 'devices' domain.
	 */
	public async handle(req: Request, parts: string[]): Promise<Response> {
		let username = "";
		let deviceId = "";

		if (parts.length === 1) {
			username = parts[0].replace(".json", "");
		} else if (parts.length === 2) {
			username = parts[0];
			deviceId = parts[1].replace(".json", "");
		} else {
			return Response.json({ error: "Not Found" }, { status: 404 });
		}

		const routes: Record<string, (user: User) => Promise<Response> | Response> =
			{
				GET: (user) => this.getDevices(user),
				POST: (user) => this.updateDevice(req, user, deviceId),
			};

		const handler = routes[req.method];
		if (!handler) {
			return Response.json({ error: "Method Not Allowed" }, { status: 405 });
		}

		return this.authenticator.withAuth(req, username, handler);
	}

	/**
	 * Retrieves the devices for the authenticated user.
	 */
	private getDevices(user: User): Response {
		const devices = this.deviceService.getDevices(user.id);
		return Response.json(devices);
	}

	/**
	 * Updates or registers a device for the authenticated user.
	 */
	private async updateDevice(
		req: Request,
		user: User,
		deviceId: string,
	): Promise<Response> {
		if (!deviceId) {
			return Response.json({ error: "Device ID required" }, { status: 400 });
		}

		let caption = deviceId;
		let type = "phone";

		try {
			const body = (await req.json()) as { caption?: string; type?: string };
			if (body.caption) {
				caption = body.caption;
			}
			if (body.type) {
				type = body.type;
			}
		} catch {}

		this.deviceService.saveDevice(user.id, deviceId, caption, type);
		return Response.json({ status: "ok" });
	}
}
