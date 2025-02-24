import {BotClient} from 'djs-core';
import {config} from 'dotenv';
config();
const zzzz = new BotClient();
zzzz.start(process.env.TOKEN);
import a from "./src/config.ts";
import b from "./src/events/message.ts";
import c from "./src/interactions/buttons/ping.ts";
import d from "./src/interactions/buttons/sub/ping.ts";
import e from "./src/interactions/commands/utils/autocomplete.ts";
import f from "./src/interactions/commands/utils/handler/autocomplete.ts";
import g from "./src/interactions/commands/utils/handler/button.ts";
import h from "./src/interactions/commands/utils/handler/modal.ts";
import i from "./src/interactions/commands/utils/handler/select.ts";
import j from "./src/interactions/commands/utils/handler.ts";
import k from "./src/interactions/commands/utils/ping.ts";
import l from "./src/interactions/commands/utils/user.ts";
import m from "./src/interactions/modals/test.ts";
import n from "./src/interactions/selects/string/test.ts";
import o from "./src/middlewares/btn.ts";
import p from "./src/middlewares/modal.ts";
import q from "./src/middlewares/select.ts";
import r from "./src/middlewares/test.ts";
export {
a,
b,
c,
d,
e,
f,
g,
h,
i,
j,
k,
l,
m,
n,
o,
p,
q,
r,
};
