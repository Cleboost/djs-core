/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { bgBlue, bgGreen, bgRed, bgYellow, white } from "chalk";

export class Logger {
  success(message: string): void {
    console.log(bgGreen(white(" ✔ ")) + " " + message);
  }

  info(message: string): void {
    console.log(bgBlue(white(" ℹ ")) + " " + message);
  }

  error(error: Error): void {
    console.log(
      bgRed(white(" ✖ ")) + " " + error.message + "\n" + error.stack,
    );
  }

  warn(message: string): void {
    console.log(bgYellow(white(" ⚠ ")) + " " + message);
  }
}
