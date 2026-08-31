import { expect, test } from "bun:test";
import { testCommand } from "@djs-core/testing";
import pingCommand from "./ping";

test("ping replies with pong", async () => {
	const res = await testCommand(pingCommand);
	expect(res.repliedWith).toContain("Pong!");
});
