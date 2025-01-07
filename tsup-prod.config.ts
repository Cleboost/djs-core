import { defineConfig } from "tsup";
import { execSync } from "child_process";
import fs from "fs";

export default defineConfig({
	format: ["cjs", "esm"],
	entryPoints: ["src/index.ts"],
	dts: true,
	shims: true,
	skipNodeModulesBundle: true,
	clean: true,
	minify: true,
	onSuccess: async () => {
		execSync("cp package.json dist && cp README.md dist");
		const packageString = fs.readFileSync("dist/package.json", "utf-8");
		const packageJson = JSON.parse(packageString);
		delete packageJson.devDependencies;
		delete packageJson.scripts;
		fs.writeFileSync("dist/package.json", JSON.stringify(packageJson, null, 2));
	},
});
