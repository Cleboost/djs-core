import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { Client } from "discord.js";
import { DjsClient } from "../DjsClient";
import {
	closeDataStore,
	getInteractionData,
	storeInteractionData,
} from "../store/DataStore";

describe("DjsClient.destroy", () => {
	let originalDestroy: typeof Client.prototype.destroy;

	beforeEach(() => {
		process.env.NODE_ENV = "test";
		originalDestroy = Client.prototype.destroy;
		Client.prototype.destroy = mock(() =>
			Promise.resolve(),
		) as typeof Client.prototype.destroy;
	});

	afterEach(() => {
		Client.prototype.destroy = originalDestroy;
		closeDataStore();
	});

	test("stops cron jobs, closes datastore, and closes db", async () => {
		const client = new DjsClient({
			djsConfig: {
				token: "test-token",
				servers: [],
				experimental: { cron: true },
			},
		});

		const clearSpy = mock(client.cronHandler.clear.bind(client.cronHandler));
		client.cronHandler.clear = clearSpy;

		storeInteractionData("shutdown-token", { ok: true });

		const closeDbClient = mock(() => {});
		client.db = { $client: { close: closeDbClient } };
		client.registerDbInit(Promise.resolve());

		await client.destroy();

		expect(clearSpy).toHaveBeenCalled();
		expect(closeDbClient).toHaveBeenCalled();
		expect(getInteractionData("shutdown-token")).toBeNull();
	});
});
