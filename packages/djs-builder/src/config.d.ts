/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { Format } from "tsup";

export interface Config {
  /**
   * The format of the output files
   * @default ["cjs"]
   */
  format?: Format[];
  /**
   * The files to bundle
   */
  files: string[];
  /**
   * The output directory
   * @default "dist"
   */
  dist?: string;
  /**
   * Obfuscate the output files
   * @default false
   * More option soon... :)
   */
  obfuscation?: boolean;
  log?: "none" | "simple" | "extend" | "debug";
  /**
   * Minify the output files
   * @default false
   * */
  minify?: boolean;
  /**
   * Production mode
   * @default false
   */
  production?: boolean;
  /**
   * File to include in build folder
   * Just copy raw file, no transformation/protection
   */
  artefact?: string[];
  /**
   * Clean the output directory before building
   * @default true
   */
  clean?: boolean;
}
