import { $ } from "bun";

const PORT = 8080;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const USERS = ["ksar", "antennapod_user", "subscriber_pod"];
const PASSWORD = "SuperSecurePassword123!";

async function getDockerMemoryMB(containerName: string): Promise<number> {
	try {
		const out =
			await $`docker stats ${containerName} --no-stream --format "{{.MemUsage}}"`.text();
		// Example output: "15.42MiB / 15.45GiB" or "102.5MiB / 15.45GiB" or "890KiB / 15.45GiB"
		const memPart = out.split("/")[0].trim();
		if (memPart.endsWith("GiB")) {
			return Math.round(Number.parseFloat(memPart.replace("GiB", "")) * 1024);
		}
		if (memPart.endsWith("MiB")) {
			return Math.round(Number.parseFloat(memPart.replace("MiB", "")));
		}
		if (memPart.endsWith("KiB")) {
			return Math.round(Number.parseFloat(memPart.replace("KiB", "")) / 1024);
		}
		if (memPart.endsWith("B")) {
			return 0;
		}
		return Number.parseFloat(memPart) || 0;
	} catch {
		return 0;
	}
}

async function runSyncCycle(username: string, device = "pixel10") {
	const basicAuth = btoa(`${username}:${PASSWORD}`);
	const headers = {
		Authorization: `Basic ${basicAuth}`,
		"Content-Type": "application/json",
	};

	// 1. Auth Login
	await fetch(`${BASE_URL}/api/2/auth/${username}/login.json`, {
		method: "POST",
		headers,
	});

	// 2. Subscriptions GET
	await fetch(`${BASE_URL}/api/2/subscriptions/${username}/${device}.json`, {
		method: "GET",
		headers,
	});

	// 3. Subscriptions GET with since
	await fetch(
		`${BASE_URL}/api/2/subscriptions/${username}/${device}.json?since=${Math.floor(Date.now() / 1000) - 3600}`,
		{
			method: "GET",
			headers,
		},
	);

	// 4. Subscriptions POST
	await fetch(`${BASE_URL}/api/2/subscriptions/${username}/${device}.json`, {
		method: "POST",
		headers,
		body: JSON.stringify({
			add: ["https://www.radioroks.ua/podcast/podcast_ro.xml"],
			remove: [],
		}),
	});

	// 5. Episodes GET
	await fetch(`${BASE_URL}/api/2/episodes/${username}.json`, {
		method: "GET",
		headers,
	});

	// 6. Episodes GET with since
	await fetch(
		`${BASE_URL}/api/2/episodes/${username}.json?since=${Math.floor(Date.now() / 1000) - 3600}`,
		{
			method: "GET",
			headers,
		},
	);

	// 7. Episodes POST
	await fetch(`${BASE_URL}/api/2/episodes/${username}.json`, {
		method: "POST",
		headers,
		body: JSON.stringify([
			{
				podcast: "https://www.radioroks.ua/podcast/podcast_ro.xml",
				episode: "https://www.radioroks.ua/podcast/ep1.mp3",
				action: "play",
				position: 450,
				total: 1800,
				timestamp: new Date().toISOString(),
				device,
			},
		]),
	});
}

export async function runDockerBenchmark(
	imageTag: string,
	containerName: string,
) {
	console.log(
		`\n================================================================`,
	);
	console.log(`Starting Docker benchmark for image [${imageTag}]...`);

	// Stop any existing container with same name or occupying port 8080
	try {
		await $`docker stop ${containerName}`.quiet();
		await $`docker rm ${containerName}`.quiet();
	} catch {}
	try {
		await $`docker stop podhound`.quiet();
		await $`docker rm podhound`.quiet();
	} catch {}

	// Run new container
	await $`docker run -d --name ${containerName} -p 8080:8080 -e AUTO_REGISTER=true -e PORT=8080 ${imageTag}`.quiet();
	console.log(`Container [${containerName}] launched successfully.`);

	// Wait 1.5s for server to initialize
	await new Promise((resolve) => setTimeout(resolve, 1500));

	// Phase A: Startup Memory
	const memA = await getDockerMemoryMB(containerName);
	console.log(`Phase A (Startup/Idle RAM): ${memA} MB`);

	// Phase B: Registration & Initial Login
	for (const u of USERS) {
		await runSyncCycle(u);
	}
	const memB = await getDockerMemoryMB(containerName);
	console.log(`Phase B (Initial Auth/Register RAM): ${memB} MB`);

	// Phase C: 20 Repeated AntennaPod Sync Cycles
	console.log("Running Phase C: 20 repeated AntennaPod sync cycles...");
	for (let i = 0; i < 20; i++) {
		for (const u of USERS) {
			await runSyncCycle(u);
		}
	}
	const memC = await getDockerMemoryMB(containerName);
	console.log(`Phase C (20 Sync Cycles RAM): ${memC} MB`);

	// Phase D: Post-Load Retention
	await new Promise((resolve) => setTimeout(resolve, 2000));
	const memD = await getDockerMemoryMB(containerName);
	console.log(`Phase D (Post-Load Retention RAM): ${memD} MB`);

	// Cleanup container
	await $`docker stop ${containerName}`.quiet();
	await $`docker rm ${containerName}`.quiet();

	return {
		phaseA: memA,
		phaseB: memB,
		phaseC: memC,
		phaseD: memD,
	};
}

if (import.meta.main) {
	const image = process.argv[2] || "podhound:baseline";
	const container = process.argv[3] || "podhound-bench";
	runDockerBenchmark(image, container).then((res) => {
		console.log("\n--- DOCKER BENCHMARK RESULTS ---");
		console.log(JSON.stringify(res, null, 2));
	});
}
