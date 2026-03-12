import { describe, expect, test } from "bun:test";
import { Collection } from "discord.js";
import ApplicationCommandHandler from "../handler/ApplicationCommandHandler";

test("ApplicationCommandHandler benchmark", async () => {
    const mockSet = async (commands: any, guildId?: string) => {
        // simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 50));
        return new Collection();
    };

    const client = {
        isReady: () => true,
        getDjsConfig: () => ({}),
        application: {
            commands: {
                set: mockSet
            }
        }
    } as any;

    const handler = new ApplicationCommandHandler(client);
    const guilds = Array.from({ length: 20 }, (_, i) => `guild-${i}`);
    handler.setGuilds(guilds);

    const start = performance.now();
    await handler.sync();
    const end = performance.now();

    console.log(`Sync time for ${guilds.length} guilds: ${end - start}ms`);
});