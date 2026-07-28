export class HealthRouter {
	public handle(pathname: string): Response | null {
		if (pathname !== "/" && pathname !== "/health") {
			return null;
		}

		return Response.json({
			service: "Podhound",
			status: "healthy",
			gpodder_api: "v2",
		});
	}
}
