import { defineConfig } from "tsup";

export default defineConfig({
    format: ["cjs"],
    entry: ["src/**/*.ts"],
    outDir: "dist",
    splitting: false, 
    onSuccess: process.platform === "win32" ? "copy src/.env dist/.env && cd dist && node index.js" : "cp src/.env dist/.env && cd dist && node index.js",
    silent: true,
    clean: true,
    skipNodeModulesBundle: true,
});
