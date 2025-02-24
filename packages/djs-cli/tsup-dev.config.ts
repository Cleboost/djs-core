import { defineConfig } from "tsup";

export default defineConfig({
  format: ["cjs"],
  entry: ["src/index.ts"],
  outDir: "dist",
  onSuccess: "cd playground && pnpm i && pnpm run test",
  dts: true,
  skipNodeModulesBundle: true,
  watch: true,
});
