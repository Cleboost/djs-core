import { describe, expect, test, mock, beforeAll, afterAll } from "bun:test";
import { Collection } from "discord.js";
import ApplicationCommandHandler from "../handler/ApplicationCommandHandler";

describe("ApplicationCommandHandler", () => {
    let originalSkipSync: string | undefined;

    beforeAll(() => {
        originalSkipSync = process.env.SKIP_SYNC;
        delete process.env.SKIP_SYNC;
    });

    afterAll(() => {
        process.env.SKIP_SYNC = originalSkipSync;
    });

    test("sync calls commands.set for each guild in parallel", async () => {
        const mockSet = mock(async (commands: any, guildId?: string) => {
            return new Collection();
        });

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
        const guilds = Array.from({ length: 12 }, (_, i) => `guild-${i}`);
        handler.setGuilds(guilds);

        await handler.sync();

        // Should be called 12 times
        expect(mockSet).toHaveBeenCalledTimes(12);
        
        // Verify calls with correct guild IDs
        for (let i = 0; i < guilds.length; i++) {
            expect(mockSet).toHaveBeenNthCalledWith(i + 1, expect.any(Array), guilds[i]);
        }
    });

    test("sync handles global registration when no guilds are specified", async () => {
        const mockSet = mock(async (commands: any, guildId?: string) => {
            return new Collection();
        });

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
        handler.setGuilds([]);

        await handler.sync();

        expect(mockSet).toHaveBeenCalledTimes(1);
        expect(mockSet).toHaveBeenCalledWith(expect.any(Array));
    });
});
