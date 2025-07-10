#!/usr/bin/env node

import { Command as Cli } from "commander";
import registerGenerateCommand from "./commands/generateCommand";
import registerDev from "./commands/dev";
import registerBuild from "./commands/build";
import registerGenerateEvent from "./commands/generateEvent";

const program = new Cli();
program
  .name("djs-core")
  .description("CLI for the djs-core framework")
  .version("2.0.0");

registerGenerateCommand(program);
registerGenerateEvent(program);
registerDev(program);
registerBuild(program);

program.parse(process.argv);