import type { Client, ClientEvents } from "discord.js";

export default class EventListener<
	K extends keyof ClientEvents = keyof ClientEvents,
> {
	private _event?: K;
	private _listener?: (client: Client<true>, ...args: ClientEvents[K]) => void;

	public event<EventKey extends keyof ClientEvents>(
		event: EventKey,
	): EventListener<EventKey> {
		const newLister = new EventListener<EventKey>();
		newLister._event = event;
		return newLister;
	}

	public run(
		listener: (client: Client<true>, ...args: ClientEvents[K]) => void,
	): this {
		this._listener = listener;
		return this;
	}

	public on(client: Client): void {
		if (!this._event || !this._listener) {
			throw new Error(
				"EventListener must have both event and listener defined. Use .event() and .run() before calling .on()",
			);
		}
		const listener = this._listener;
		const event = this._event;
		client.on(event, (...args: ClientEvents[K]) => {
			listener(client as Client<true>, ...args);
		});
	}

	public getEvent(): K | undefined {
		return this._event;
	}

	public getListener():
		| ((client: Client<true>, ...args: ClientEvents[K]) => void)
		| undefined {
		return this._listener;
	}
}
