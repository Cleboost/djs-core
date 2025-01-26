import { EventListner } from "djs-core";
import { Events, Message } from "discord.js";

export default new EventListner()
  .setEvent(Events.MessageCreate)
  .run((client, message) => {
    const msg = message as Message;
    console.log(msg.content);
  });
