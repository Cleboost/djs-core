/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { Format } from "tsup";

export interface DockerConfig {
  /**
   * Base Node.js image to use
   * @default "node:18-alpine"
   */
  baseImage?: string;
  /**
   * Port to expose in the container
   * @default 3000
   */
  port?: number;
  /**
   * Whether to generate docker-compose.yml
   * @default true
   */
  compose?: boolean;
  /**
   * Environment variables for Docker
   */
  env?: Record<string, string>;
  /**
   * Additional packages to install in the container
   */
  packages?: string[];
}

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
  /**
   * Generate Docker files for containerization
   * @default false
   */
  docker?: boolean | DockerConfig;
}
