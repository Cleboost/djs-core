import { defineConfig } from "tsup";

export default defineConfig({
  format: ["cjs"],
  entry: ["src/index.ts"],
  outDir: "dist",
  onSuccess: "cd playground && pnpm run dev",
  dts: true,
  skipNodeModulesBundle: true,
  clean: true,
  watch: true
});
