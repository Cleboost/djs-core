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

  error(message: string): void {
    console.log(bgRed(white(" ✖ ")) + " " + message);
  }

  warn(message: string): void {
    console.log(bgYellow(white(" ⚠ ")) + " " + message);
  }
}
