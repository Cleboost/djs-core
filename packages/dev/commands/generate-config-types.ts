import type { CAC } from "cac";
import fs from "fs/promises";
import path from "path";
import pc from "picocolors";
import { banner } from "../utils/common";

async function generateTypesFromJson(
	configJsonPath: string,
	outputPath: string,
): Promise<void> {
	const jsonContent = await fs.readFile(configJsonPath, "utf-8");
	const config = JSON.parse(jsonContent);

	const typeDefinition = generateTypeDefinition(config, "UserConfig");

	const fileContent = `// Auto-generated from config.json. Do not edit manually.

${typeDefinition}

export type { UserConfig };
`;

	await fs.writeFile(outputPath, fileContent, "utf-8");
}

function generateTypeDefinition(
	obj: unknown,
	typeName: string,
	indent = 0,
): string {
	if (obj === null) return "null";
	if (obj === undefined) return "undefined";

	const indentStr = "  ".repeat(indent);
	const nextIndentStr = "  ".repeat(indent + 1);

	if (Array.isArray(obj)) {
		if (obj.length === 0) return "unknown[]";
		const firstElement = obj[0];
		const elementType = inferType(firstElement);
		return `${elementType}[]`;
	}

	if (typeof obj === "object") {
		const entries = Object.entries(obj);
		if (entries.length === 0) return "Record<string, unknown>";

		const properties = entries
			.map(([key, value]) => {
				const valueType = inferType(value);
				return `${nextIndentStr}${key}: ${valueType};`;
			})
			.join("\n");

		return `${indent === 0 ? "" : "\n"}${indentStr}interface ${typeName} {\n${properties}\n${indentStr}}`;
	}

	return inferType(obj);
}

function inferType(value: unknown): string {
	if (value === null) return "null";
	if (value === undefined) return "undefined";
	if (typeof value === "string") return "string";
	if (typeof value === "number") return "number";
	if (typeof value === "boolean") return "boolean";

	if (Array.isArray(value)) {
		if (value.length === 0) return "unknown[]";
		const firstElement = value[0];
		const elementType = inferType(firstElement);
		const allSameType = value.every((v) => inferType(v) === elementType);
		return allSameType ? `${elementType}[]` : "unknown[]";
	}

	if (typeof value === "object") {
		const entries = Object.entries(value);
		if (entries.length === 0) return "Record<string, unknown>";

		const properties = entries
			.map(([key, val]) => {
				const valueType = inferType(val);
				return `${key}: ${valueType}`;
			})
			.join("; ");

		return `{ ${properties} }`;
	}

	return "unknown";
}

export function registerGenerateConfigTypesCommand(cli: CAC) {
	cli
		.command("generate-config-types", "Generate TypeScript types from config.json")
		.option("-p, --path <path>", "Custom project path", { default: "." })
		.action(async (options: { path: string }) => {
			console.log(banner);
			console.log(`${pc.cyan("ℹ")}  Generating config types...`);

			const projectRoot = path.resolve(process.cwd(), options.path);
			const configJsonPath = path.join(projectRoot, "config.json");
			const outputPath = path.join(projectRoot, "config.types.ts");

			try {
				await fs.access(configJsonPath);
			} catch {
				console.error(
					pc.red(
						`❌ config.json not found at ${configJsonPath}\n   Create a config.json file first.`,
					),
				);
				process.exit(1);
			}

			try {
				await generateTypesFromJson(configJsonPath, outputPath);
				console.log(
					pc.green(`✓  Types generated successfully at ${outputPath}`),
				);
			} catch (error: unknown) {
				console.error(pc.red("❌ Error generating types:"), error);
				process.exit(1);
			}
		});
}
