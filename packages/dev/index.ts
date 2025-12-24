#!/usr/bin/env bun
import { cac } from "cac";
import type { Config } from "../utils/types/config";
import { registerBuildCommand } from "./commands/build";
import { registerDevCommand } from "./commands/dev";
import { registerStartCommand } from "./commands/start";

export type { Config };

const cli = cac("djs-core").version("2.0.0").help();

registerStartCommand(cli);
registerDevCommand(cli);
registerBuildCommand(cli);

cli.parse();
