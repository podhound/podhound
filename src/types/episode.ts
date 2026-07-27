export interface EpisodeActionPayload {
	podcast: string;
	episode: string;
	action: string;
	timestamp?: number;
	position?: number;
	total?: number;
}
