import type { CAC } from 'cac'
import { banner, runBot } from '../utils/common'

export function registerStartCommand(cli: CAC) {
  cli
    .command('start', 'Start the bot')
    .option('-p, --path', 'Custom project path', { default: "." })
    .action(async (options) => {
      console.log(banner)
      await runBot(options.path)
    })
}

