import type { TestInteractionOptions } from "./types";

export function mockUser(opts?: { id: string; username?: string }) {
	return {
		id: opts?.id ?? "123456789012345678",
		username: opts?.username ?? "testuser",
		tag: opts?.username ?? "testuser",
	};
}

export function mockGuild(opts?: { id: string; name?: string }) {
	return {
		id: opts?.id ?? "987654321098765432",
		name: opts?.name ?? "Test Guild",
	};
}

export function mockChannel(opts?: { id: string; type?: number }) {
	return {
		id: opts?.id ?? "111111111111111111",
		type: opts?.type ?? 0,
	};
}

/** Auto-stub unknown plugin APIs: client.demo.sayHello() → "test" */
function createPluginStub(): unknown {
	const stub = () => undefined;
	return new Proxy(stub, {
		get(_target, prop) {
			if (prop === "then") return undefined;
			return createPluginStub();
		},
		apply() {
			return "test";
		},
	});
}

const defaultDbStub = {
	get: async () => ({ val: 1 }),
	execute: async () => [],
	select: () => defaultDbStub,
	from: () => defaultDbStub,
	where: () => defaultDbStub,
	insert: () => ({ values: async () => undefined }),
	update: () => ({ set: () => ({ where: async () => undefined }) }),
	delete: () => ({ where: async () => undefined }),
};

export function mockClient(
	extensions: Record<string, unknown> = {},
): Record<string, unknown> {
	const base: Record<string, unknown> = {
		user: mockUser({ id: "999999999999999999", username: "TestBot" }),
		db: {
			...defaultDbStub,
			...(typeof extensions.db === "object" && extensions.db !== null
				? extensions.db
				: {}),
		},
	};

	for (const [key, value] of Object.entries(extensions)) {
		if (key !== "db") base[key] = value;
	}

	return new Proxy(base, {
		get(target, prop, receiver) {
			if (Object.hasOwn(target, prop)) {
				return Reflect.get(target, prop, receiver);
			}
			return createPluginStub();
		},
	});
}

export function applyContextFields(
	interaction: Record<string, unknown>,
	opts: TestInteractionOptions,
): void {
	const user = mockUser(opts.user);
	interaction.user = user;
	interaction.member = opts.member ?? { user, id: user.id };
	interaction.guild = mockGuild(opts.guild);
	interaction.guildId = (interaction.guild as { id: string }).id;
	interaction.channel = mockChannel(opts.channel);
	interaction.channelId = (interaction.channel as { id: string }).id;
	interaction.client = mockClient(opts.client ?? {});
}
