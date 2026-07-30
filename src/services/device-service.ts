import type { Database } from "bun:sqlite";

export interface DeviceDto {
	id: string;
	caption: string;
	type: string;
	subscriptions: number;
}

export class DeviceService {
	constructor(private db: Database) {}

	public saveDevice(
		userId: number,
		deviceId: string,
		caption: string,
		type: string,
	): void {
		this.db
			.prepare(
				`INSERT INTO devices (user_id, device_id, caption, type)
				 VALUES (?, ?, ?, ?)
				 ON CONFLICT(user_id, device_id) DO UPDATE SET caption = excluded.caption, type = excluded.type`,
			)
			.run(userId, deviceId, caption || deviceId, type || "phone");
	}

	public getDevices(userId: number): DeviceDto[] {
		const devices = this.db
			.prepare(
				`SELECT d.device_id as id, d.caption, d.type,
				 (SELECT COUNT(*) FROM subscriptions WHERE user_id = d.user_id) as subscriptions
				 FROM devices d WHERE d.user_id = ?`,
			)
			.all(userId) as DeviceDto[];

		if (devices.length === 0) {
			const subCount =
				(
					this.db
						.prepare(
							"SELECT COUNT(*) as count FROM subscriptions WHERE user_id = ?",
						)
						.get(userId) as { count: number }
				)?.count || 0;

			return [
				{
					id: "antennapod",
					caption: "AntennaPod",
					type: "phone",
					subscriptions: subCount,
				},
			];
		}

		return devices;
	}
}
