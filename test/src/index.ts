import { BotClient } from 'djs-core';
import {config} from 'dotenv'

config({path: '.env'})

const client = new BotClient()
client.start(process.env.TOKEN)

export default client