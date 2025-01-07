import { defineConfig } from "tsup";

export default defineConfig({
	format: ["cjs"],
	entryPoints: ["src/**/*.ts"],
    outDir: "dist",
    splitting: false, 
    onSuccess: "cp src/.env dist/.env && cd dist && node index.js",
    silent: true,
    clean: true,
});
