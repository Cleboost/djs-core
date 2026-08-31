import type { CAC } from "cac";
import fs from "fs/promises";
import path from "path";
import pc from "picocolors";
import { PATH_ALIASES } from "../utils/common";

async function listTsFiles(dir: string): Promise<string[]> {
	try {
		await fs.access(dir);
	} catch {
		return [];
	}
	const out: string[] = [];
	const entries = await fs.readdir(dir, { withFileTypes: true });
	for (const e of entries) {
		const full = path.join(dir, e.name);
		if (e.isDirectory()) {
			out.push(...(await listTsFiles(full)));
		} else if (
			e.isFile() &&
			e.name.endsWith(".ts") &&
			!e.name.endsWith(".d.ts") &&
			!e.name.endsWith(".test.ts")
		) {
			out.push(full);
		}
	}
	return out;
}

function routeFromFile(baseDir: string, file: string): string {
	const rel = path.relative(baseDir, file);
	const parts = rel.replace(/\.ts$/i, "").split(path.sep).filter(Boolean);
	if (parts[parts.length - 1] === "index") parts.pop();
	return parts.join(".");
}

type Entry = {
	type: string;
	color: (s: string) => string;
	route: string;
	file: string;
};

function printSection(title: string, entries: Entry[], relRoot: string) {
	if (entries.length === 0) return;

	console.log(`\n  ${pc.bold(title)} ${pc.dim(`(${entries.length})`)}`);

	const maxRoute = Math.max(...entries.map((e) => e.route.length));

	for (const e of entries) {
		const badge = e.color(` ${e.type} `);
		const route = e.route.padEnd(maxRoute);
		const file = pc.dim(path.relative(relRoot, e.file));
		console.log(`    ${badge}  ${route}  ${pc.dim("→")}  ${file}`);
	}
}

export function registerListCommand(cli: CAC) {
	cli
		.command(
			"list",
			"List all detected commands, buttons, menus, events and cron tasks",
		)
		.option("-p, --path <path>", "Custom project path", { default: "." })
		.action(async (options: { path: string }) => {
			const root = path.resolve(process.cwd(), options.path);

			const commandsDir = path.join(
				root,
				PATH_ALIASES.interactions,
				"commands",
			);
			const contextsDir = path.join(
				root,
				PATH_ALIASES.interactions,
				"contexts",
			);
			const buttonsDir = path.join(root, PATH_ALIASES.components, "buttons");
			const selectsDir = path.join(root, PATH_ALIASES.components, "selects");
			const modalsDir = path.join(root, PATH_ALIASES.components, "modals");
			const eventsDir = path.join(root, PATH_ALIASES.events);
			const cronDir = path.join(root, "src", "cron");

			const [
				cmdFiles,
				ctxFiles,
				btnFiles,
				selFiles,
				modFiles,
				evtFiles,
				cronFiles,
			] = await Promise.all([
				listTsFiles(commandsDir),
				listTsFiles(contextsDir),
				listTsFiles(buttonsDir),
				listTsFiles(selectsDir),
				listTsFiles(modalsDir),
				listTsFiles(eventsDir),
				listTsFiles(cronDir),
			]);

			const total =
				cmdFiles.length +
				ctxFiles.length +
				btnFiles.length +
				selFiles.length +
				modFiles.length +
				evtFiles.length +
				cronFiles.length;

			if (total === 0) {
				console.log(pc.yellow("\n  No interactions found in src/\n"));
				return;
			}

			console.log(
				`\n  ${pc.bold(pc.blue("djs-core list"))}  ${pc.dim(root)}\n`,
			);

			printSection(
				"Commands",
				cmdFiles.map((f) => ({
					type: "cmd",
					color: (s: string) => pc.bgBlue(pc.white(s)),
					route: routeFromFile(commandsDir, f),
					file: f,
				})),
				root,
			);

			printSection(
				"Context Menus",
				ctxFiles.map((f) => ({
					type: "ctx",
					color: (s: string) => pc.bgMagenta(pc.white(s)),
					route: routeFromFile(contextsDir, f),
					file: f,
				})),
				root,
			);

			printSection(
				"Buttons",
				btnFiles.map((f) => ({
					type: "btn",
					color: (s: string) => pc.bgGreen(pc.white(s)),
					route: routeFromFile(buttonsDir, f),
					file: f,
				})),
				root,
			);

			printSection(
				"Select Menus",
				selFiles.map((f) => ({
					type: "sel",
					color: (s: string) => pc.bgCyan(pc.black(s)),
					route: routeFromFile(selectsDir, f),
					file: f,
				})),
				root,
			);

			printSection(
				"Modals",
				modFiles.map((f) => ({
					type: "modal",
					color: (s: string) => pc.bgYellow(pc.black(s)),
					route: routeFromFile(modalsDir, f),
					file: f,
				})),
				root,
			);

			printSection(
				"Events",
				evtFiles.map((f) => ({
					type: "event",
					color: (s: string) => pc.bgWhite(pc.black(s)),
					route: path.basename(f, ".ts"),
					file: f,
				})),
				root,
			);

			printSection(
				"Cron Tasks",
				cronFiles.map((f) => ({
					type: "cron",
					color: (s: string) => pc.bgRed(pc.white(s)),
					route: path.basename(f, ".ts"),
					file: f,
				})),
				root,
			);

			const counts = [
				cmdFiles.length &&
					`${cmdFiles.length} command${cmdFiles.length > 1 ? "s" : ""}`,
				ctxFiles.length &&
					`${ctxFiles.length} context menu${ctxFiles.length > 1 ? "s" : ""}`,
				btnFiles.length &&
					`${btnFiles.length} button${btnFiles.length > 1 ? "s" : ""}`,
				selFiles.length &&
					`${selFiles.length} select menu${selFiles.length > 1 ? "s" : ""}`,
				modFiles.length &&
					`${modFiles.length} modal${modFiles.length > 1 ? "s" : ""}`,
				evtFiles.length &&
					`${evtFiles.length} event${evtFiles.length > 1 ? "s" : ""}`,
				cronFiles.length &&
					`${cronFiles.length} cron task${cronFiles.length > 1 ? "s" : ""}`,
			].filter(Boolean);

			console.log(`\n  ${pc.green("✓")}  ${counts.join(pc.dim(", "))}\n`);
		});
}
