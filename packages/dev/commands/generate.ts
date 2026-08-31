import fs from "node:fs/promises";
import path from "node:path";
import type { CAC } from "cac";
import pc from "picocolors";
import { PATH_ALIASES } from "../utils/common";

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

function toPascalCase(str: string): string {
	return str
		.split(/[-_./]/)
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
		.join("");
}

type Template = (name: string) => string;

const templates: Record<
	string,
	{
		dest: (root: string, name: string) => string;
		template: Template;
	}
> = {
	command: {
		dest: (root, name) =>
			resolveSafeDest(
				path.join(root, PATH_ALIASES.interactions, "commands"),
				name,
			),
		template: () => `import { Command } from "@djs-core/runtime";

export default new Command()
	.setDescription("TODO: describe this command")
	.run(async (interaction) => {
		await interaction.reply("Hello!");
	});
`,
	},

	button: {
		dest: (root, name) =>
			resolveSafeDest(
				path.join(root, PATH_ALIASES.components, "buttons"),
				name,
			),
		template: (name) => `import { Button } from "@djs-core/runtime";
import { MessageFlags } from "discord.js";

export default new Button()
	.setLabel("${toPascalCase(name)}")
	.run(async (interaction) => {
		await interaction.reply({ content: "Button clicked!", flags: [MessageFlags.Ephemeral] });
	});
`,
	},

	modal: {
		dest: (root, name) =>
			resolveSafeDest(path.join(root, PATH_ALIASES.components, "modals"), name),
		template: (name) => `import { Modal } from "@djs-core/runtime";
import { TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } from "discord.js";

export default new Modal()
	.setTitle("${toPascalCase(name)}")
	.addComponents(
		new ActionRowBuilder<TextInputBuilder>().addComponents(
			new TextInputBuilder()
				.setCustomId("input")
				.setLabel("TODO: label")
				.setStyle(TextInputStyle.Short),
		),
	)
	.run(async (interaction) => {
		const value = interaction.fields.getTextInputValue("input");
		await interaction.reply({ content: \`You entered: \${value}\`, flags: [MessageFlags.Ephemeral] });
	});
`,
	},

	select: {
		dest: (root, name) =>
			resolveSafeDest(
				path.join(root, PATH_ALIASES.components, "selects"),
				name,
			),
		template: () => `import { StringSelectMenu } from "@djs-core/runtime";
import { MessageFlags } from "discord.js";

export default new StringSelectMenu()
	.setPlaceholder("Choose an option")
	.addOptions([
		{ label: "Option 1", value: "option_1" },
		{ label: "Option 2", value: "option_2" },
	])
	.run(async (interaction) => {
		const [selected] = interaction.values;
		await interaction.reply({ content: \`You picked: \${selected}\`, flags: [MessageFlags.Ephemeral] });
	});
`,
	},

	event: {
		dest: (root, name) =>
			resolveSafeDest(path.join(root, PATH_ALIASES.events), name),
		template: (name) => `import { EventListener } from "@djs-core/runtime";
import { Events } from "discord.js";

export default new EventListener()
	.event(Events.${toPascalCase(name)})
	.run(async (_client) => {
		// TODO: handle ${name}
	});
`,
	},

	context: {
		dest: (root, name) =>
			resolveSafeDest(
				path.join(root, PATH_ALIASES.interactions, "contexts"),
				name,
			),
		template: () => `import { ContextMenu } from "@djs-core/runtime";
import { ApplicationCommandType, MessageFlags } from "discord.js";

export default new ContextMenu()
	.setType(ApplicationCommandType.User)
	.run(async (interaction) => {
		await interaction.reply({ content: "Context menu triggered!", flags: [MessageFlags.Ephemeral] });
	});
`,
	},
};

const TYPES = Object.keys(templates);

export function resolveSafeDest(baseDir: string, name: string): string {
	if (!name || name.includes("\0") || path.isAbsolute(name)) {
		throw new Error(`Invalid name: ${name}`);
	}

	const resolvedBase = path.resolve(baseDir);
	const dest = path.normalize(path.join(resolvedBase, `${name}.ts`));
	const resolvedDest = path.resolve(dest);
	const basePrefix = resolvedBase.endsWith(path.sep)
		? resolvedBase
		: `${resolvedBase}${path.sep}`;

	if (resolvedDest !== resolvedBase && !resolvedDest.startsWith(basePrefix)) {
		throw new Error(`Invalid name: ${name}`);
	}

	return resolvedDest;
}

function assertDestWithinRoot(root: string, dest: string): void {
	const resolvedRoot = path.resolve(root);
	const resolvedDest = path.resolve(path.normalize(dest));
	const rootPrefix = resolvedRoot.endsWith(path.sep)
		? resolvedRoot
		: `${resolvedRoot}${path.sep}`;

	if (resolvedDest !== resolvedRoot && !resolvedDest.startsWith(rootPrefix)) {
		throw new Error("Generated path escapes project root");
	}
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export function registerGenerateCommand(cli: CAC) {
	cli
		.command("generate <type> <name>", "Scaffold a new interaction file")
		.alias("g")
		.option("-p, --path <path>", "Custom project path", { default: "." })
		.option("--force", "Overwrite if file already exists")
		.action(
			async (
				type: string,
				name: string,
				options: { path: string; force?: boolean },
			) => {
				const tpl = templates[type];

				if (!tpl) {
					console.error(pc.red(`\n  Unknown type: ${pc.bold(type)}`));
					console.error(pc.dim(`  Available: ${TYPES.join(", ")}\n`));
					process.exit(1);
				}

				const root = path.resolve(process.cwd(), options.path);
				let dest: string;
				try {
					dest = tpl.dest(root, name);
					assertDestWithinRoot(root, dest);
				} catch (error) {
					const message =
						error instanceof Error ? error.message : String(error);
					console.error(pc.red(`\n  ${message}\n`));
					process.exit(1);
				}
				const rel = path.relative(root, dest);

				// Check existence
				try {
					await fs.access(dest);
					if (!options.force) {
						console.error(pc.red(`\n  File already exists: ${pc.bold(rel)}`));
						console.error(pc.dim("  Use --force to overwrite\n"));
						process.exit(1);
					}
				} catch {
					// file doesn't exist — good
				}

				await fs.mkdir(path.dirname(dest), { recursive: true });
				await fs.writeFile(dest, tpl.template(name), "utf-8");

				console.log(`\n  ${pc.green("✓")}  Created ${pc.bold(pc.cyan(rel))}\n`);
			},
		);
}
