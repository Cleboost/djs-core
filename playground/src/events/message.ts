/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { EventListner } from "djs-core";
import { Events, Message } from "discord.js";

export default new EventListner()
  .setEvent(Events.MessageCreate)
  .run((client, message) => {
    const msg = message as Message;
    console.log(msg.content);
  });
