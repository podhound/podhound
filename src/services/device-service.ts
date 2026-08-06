import type { Database, Statement } from "bun:sqlite";

export interface DeviceDto {
	id: string;
	caption: string;
	type: string;
	subscriptions: number;
}

export class DeviceService {
	private saveDeviceStmt: Statement;
	private getDevicesStmt: Statement;
	private countSubscriptionsStmt: Statement;

	constructor(private db: Database) {
		this.saveDeviceStmt = this.db.prepare(
			`INSERT INTO devices (user_id, device_id, caption, type)
			 VALUES (?, ?, ?, ?)
			 ON CONFLICT(user_id, device_id) DO UPDATE SET caption = excluded.caption, type = excluded.type`,
		);
		this.getDevicesStmt = this.db.prepare(
			`SELECT d.device_id as id, d.caption, d.type,
			 (SELECT COUNT(*) FROM subscriptions WHERE user_id = d.user_id) as subscriptions
			 FROM devices d WHERE d.user_id = ?`,
		);
		this.countSubscriptionsStmt = this.db.prepare(
			"SELECT COUNT(*) as count FROM subscriptions WHERE user_id = ?",
		);
	}

	public saveDevice(
		userId: number,
		deviceId: string,
		caption: string,
		type: string,
	): void {
		this.saveDeviceStmt.run(
			userId,
			deviceId,
			caption || deviceId,
			type || "phone",
		);
	}

	public getDevices(userId: number): DeviceDto[] {
		const devices = this.getDevicesStmt.all(userId) as DeviceDto[];

		if (devices.length === 0) {
			const subCount =
				(this.countSubscriptionsStmt.get(userId) as { count: number })?.count ||
				0;

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
