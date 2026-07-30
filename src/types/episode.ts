export interface EpisodeActionPayload {
	podcast: string;
	episode: string;
	action: string;
	timestamp?: number | string;
	position?: number;
	total?: number;
	device?: string;
	started?: number;
	guid?: string;
}
