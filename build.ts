import { createHash } from "node:crypto";
import { rmSync } from "node:fs";
import { readdir, rename } from "node:fs/promises";
import path from "node:path";
import { build, file, write } from "bun";
import type { GetAgent, TypingMindAgent } from "./src/types/typingmind-agent";
import type { TypingMindGetPlugin } from "./src/types/typingmind-plugin";

const distDir = path.resolve(__dirname, "dist");
const pluginsDir = path.resolve(__dirname, path.join("src", "plugins"));

// Clean the dist directory
rmSync(distDir, { recursive: true, force: true });

const pluginNames = await readdir(pluginsDir);
console.log("Building plugins:", pluginNames);

function getPluginDirs(plugin: string) {
	return {
		src: path.join(pluginsDir, plugin),
		dist: path.join(distDir, plugin),
	};
}

for (const plugin of pluginNames) {
	console.log(`Building plugin ${plugin}`);
	const pluginDirs = getPluginDirs(plugin);

	// Gotcha: We can't use multiple entrypoints in the same build
	// as Bun changes its behavior based on if there's a single entrypoint or multiple entrypoints.
	// Single entrypoint: The output is directly written to the outdir
	// Multiple entrypoints: The output is written to a subdirectory named after the entrypoint

	await build({
		entrypoints: [pluginDirs.src],
		outdir: distDir,
		target: "browser",
	});
}

for (const plugin of pluginNames) {
	console.log(`Processing plugin ${plugin}`);
	const pluginDirs = getPluginDirs(plugin);

	// Remove the ESM exports from the generated code as it's not supported in the browser
	const codeFile = file(`${pluginDirs.dist}/index.js`);
	let code = await codeFile.text();
	code = code.replace(/export {.*?};/gs, "");
	await write(`${pluginDirs.dist}/index.js`, code);

	// Move to implementation.js
	await rename(
		`${pluginDirs.dist}/index.js`,
		`${pluginDirs.dist}/implementation.js`,
	);

	// Copy README
	const readmeFile = file(`${pluginDirs.src}/README.md`);
	if (await readmeFile.exists()) {
		await write(`${pluginDirs.dist}/README.md`, readmeFile);
	} else {
		console.warn(`README not found for plugin ${plugin}`);
	}

	// Transform TypingMind config
	const configFile = file(`${pluginDirs.src}/typingmind-plugin.ts`);
	if (await configFile.exists()) {
		const getPluginConfig = (await import(`${configFile.name}`))
			.default as TypingMindGetPlugin;

		// Get readme
		let readme = "";
		const readmeFile = file(`${pluginDirs.src}/README.md`);
		if (await readmeFile.exists()) {
			readme = await readmeFile.text();
		}

		const pluginConfig = getPluginConfig(readme, code);

		const pluginConfigString = JSON.stringify(pluginConfig, null, 2);
		await write(`${pluginDirs.dist}/plugin.json`, pluginConfigString);

		const agentFile = file(`${pluginDirs.src}/typingmind-agent.ts`);
		if (await agentFile.exists()) {
			// Get agent data

			const getAgent = (await import(`${agentFile.name}`))
				.default as GetAgent;
			const agentData = {
				createdAt: new Date().toISOString(),
				...getAgent(pluginConfig),
			};

			// Generate checksum
			const dataString = JSON.stringify(agentData);
			const checksum = createHash("md5").update(dataString).digest("hex");
			const agent: TypingMindAgent = {
				checksum,
				data: agentData,
			};

			const agentString = JSON.stringify(agent, null, 2);
			await write(`${pluginDirs.dist}/agent.json`, agentString);
		}
	} else {
		console.warn(
			`Plugin ${plugin} does not have a plugin file (typingmind-plugin.ts)`,
		);
	}
}

console.log("Build finished");
