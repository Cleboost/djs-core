import type { Client, ClientEvents } from "discord.js";
import type EventLister from "../interaction/EventLister";

type ListenerInfo = {
	listener: EventLister;
	event: keyof ClientEvents;
	fn: (...args: unknown[]) => void;
};

export default class EventHandler {
	private readonly client: Client;
	private listeners: Map<string, EventLister> = new Map();
	private listenerInfo: Map<string, ListenerInfo> = new Map();

	constructor(client: Client) {
		this.client = client;
	}

	public set(listeners: Record<string, EventLister>): void {
		for (const [_id, info] of this.listenerInfo.entries()) {
			this.client.off(info.event, info.fn);
		}
		this.listeners.clear();
		this.listenerInfo.clear();

		for (const [id, listener] of Object.entries(listeners)) {
			this.listeners.set(id, listener);
			this.registerListener(id, listener);
		}
	}

	public add(id: string, listener: EventLister): void {
		if (this.listeners.has(id)) {
			throw new Error(
				`A listener with id '${id}' already exists. Use remove() first or choose a different id.`,
			);
		}
		this.listeners.set(id, listener);
		this.registerListener(id, listener);
	}

	public remove(id: string): boolean {
		const info = this.listenerInfo.get(id);
		if (info) {
			this.client.off(info.event, info.fn);
			this.listeners.delete(id);
			this.listenerInfo.delete(id);
			return true;
		}
		return false;
	}

	private registerListener(id: string, listener: EventLister): void {
		const event = listener.getEvent();
		const fn = listener.getListener();

		if (!event || !fn) {
			throw new Error(
				`EventLister with id '${id}' must have both event and listener defined. Use .event() and .run() before adding.`,
			);
		}

		this.listenerInfo.set(id, {
			listener,
			event,
			fn: fn as (...args: unknown[]) => void,
		});
		this.client.on(event, fn as (...args: unknown[]) => void);
	}
}
