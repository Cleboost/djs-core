/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { Readable } from "stream";

export interface Step {
  id: "bundle" | "obfuscation" | "artefact";
  status: "start" | "progress" | "done" | "error";
  message?: string;
}

export interface BundlerReadable extends Readable {
  on(event: "step", listener: (step: Step) => void): this;

  on(event: "close", listener: () => void): this;
  on(event: "data", listener: (chunk: unknown) => void): this;
  on(event: "end", listener: () => void): this;
  on(event: "error", listener: (err: Error) => void): this;
  on(event: "pause", listener: () => void): this;
  on(event: "readable", listener: () => void): this;
  on(event: "resume", listener: () => void): this;
}
