export interface CliSubRouter {
	readonly slug: string;
	/**
	 * Processes CLI arguments for this specific router domain.
	 */
	handle(positionals: string[]): Promise<void> | void;
	/**
	 * Prints usage instructions for this router's commands.
	 */
	printUsage(): void;
}
