#!/usr/bin/env bun
import { cac } from 'cac'
import { registerStartCommand } from './commands/start'
import { registerDevCommand } from './commands/dev'
import type { Config } from '../utils/types/config'

const cli = cac('djs-core').version('1.0.0').help()

registerStartCommand(cli)
registerDevCommand(cli)

cli.parse()

export type { Config }
