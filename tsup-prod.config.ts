import { defineConfig } from "tsup";
import fs from "fs";

export default defineConfig({
	format: ["cjs"],
	entryPoints: ["src/index.ts"],
	dts: true,
	shims: true,
	skipNodeModulesBundle: true,
	clean: true,
	minify: true,
	onSuccess: async () => {
		fs.copyFileSync("package.json", "dist/package.json");
		fs.copyFileSync("README.md", "dist/README.md");
		const packageString = fs.readFileSync("dist/package.json", "utf-8");
		const packageJson = JSON.parse(packageString);
		delete packageJson.devDependencies;
		delete packageJson.scripts;
		fs.writeFileSync("dist/package.json", JSON.stringify(packageJson, null, 2));
	},
});
