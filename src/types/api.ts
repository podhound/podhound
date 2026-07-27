export interface ApiSubRouter {
	readonly domain: string;
	handle(req: Request, pathParts: string[]): Promise<Response> | Response;
}
