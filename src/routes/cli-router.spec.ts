import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { CliSubRouter } from "../types";
import { CliRouter } from "./cli-router";

describe("CliRouter", () => {
	let mockSubRouter: CliSubRouter;
	let cliRouter: CliRouter;

	beforeEach(() => {
		mockSubRouter = {
			slug: "mockdomain",
			handle: mock(() => Promise.resolve()),
			printUsage: mock(() => {}),
		};

		cliRouter = new CliRouter([mockSubRouter]);
	});

	it("should delegate to correct sub-router", async () => {
		await cliRouter.handle(["mockdomain", "action", "arg1"]);
		expect(mockSubRouter.handle).toHaveBeenCalledWith([
			"mockdomain",
			"action",
			"arg1",
		]);
	});

	it("should print usage instructions for unknown domain", async () => {
		const consoleSpy = mock(() => {});
		const originalLog = console.log;
		console.log = consoleSpy;

		try {
			await cliRouter.handle(["unknown_domain"]);
			expect(consoleSpy).toHaveBeenCalledWith("Available commands:");
			expect(mockSubRouter.printUsage).toHaveBeenCalled();
		} finally {
			console.log = originalLog;
		}
	});

	it("should print usage instructions if no arguments provided", async () => {
		const consoleSpy = mock(() => {});
		const originalLog = console.log;
		console.log = consoleSpy;

		try {
			await cliRouter.handle([]);
			expect(consoleSpy).toHaveBeenCalledWith("Available commands:");
			expect(mockSubRouter.printUsage).toHaveBeenCalled();
		} finally {
			console.log = originalLog;
		}
	});
});
