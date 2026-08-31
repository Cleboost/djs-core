type ClosableClient = {
	close?: () => void | Promise<void>;
	end?: () => void | Promise<void>;
};

export async function closeDb(db: unknown): Promise<void> {
	if (!db || typeof db !== "object") return;

	const client = (db as { $client?: ClosableClient }).$client;
	if (!client || typeof client !== "object") return;

	if (typeof client.close === "function") {
		await client.close();
		return;
	}

	if (typeof client.end === "function") {
		await client.end();
	}
}
