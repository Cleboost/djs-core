export interface DevContext {
  /** Root directory of the user's project */
  root: string;
}

export interface BuildContext extends DevContext {
  /** Output directory for the build command (dist) */
  outDir: string;
}

/**
 * Minimal contract for a djs-core plugin.
 *
 * Each method is optional; the plugin only implements what it needs.
 */
export interface DjsCorePlugin {
  /** Name of the plugin (for logs/debug) */
  name: string;

  /**
   * Hook executed at the start of the `djs-core dev` command.
   */
  onDev?(ctx: DevContext): void | Promise<void>;

  /**
   * Hook executed during the `djs-core build` command.
   */
  onBuild?(ctx: BuildContext): void | Promise<void>;

  /**
   * Hook exécuté après que tous les artefacts aient été copiés dans le dossier dist.
   * Permet aux plugins de finaliser le build (ex: génération de client Prisma).
   */
  onPostBuild?(ctx: BuildContext): void | Promise<void>;

  /**
   * Allows injecting additional TypeScript declarations.
   * Returns a string containing `.d.ts` code.
   */
  extendTypes?(): string | undefined;

  /**
   * Runtime dependencies (added to the user's package.json)
   * key = package name, value = semver version or 'latest'.
   */
  runtimeDeps?: Record<string, string>;

  /**
   * Development dependencies (added to the user's devDependencies)
   */
  devDeps?: Record<string, string>;

  /**
   * Files or folders to copy as-is into the output directory (dist/)
   * when running the build command. Paths are relative to the project root or absolute.
   */
  buildArtifacts?: string[];

  /** Called for each Discord client created by the runtime/devtools. */
  setupClient?(client: import("discord.js").Client, projectRoot?: string): void | Promise<void>;
} 