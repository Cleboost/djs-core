import type { Client, ClientEvents } from "discord.js";

export default class EventListner<
	K extends keyof ClientEvents = keyof ClientEvents,
> {
	private _event?: K;
	private _listener?: (client: Client, ...args: ClientEvents[K]) => void;

	public event<EventKey extends keyof ClientEvents>(
		event: EventKey,
	): EventListner<EventKey> {
		const newLister = new EventListner<EventKey>();
		newLister._event = event;
		return newLister;
	}

	public run(listener: (client: Client, ...args: ClientEvents[K]) => void): this {
		this._listener = listener;
		return this;
	}

	public on(client: Client): void {
		if (!this._event || !this._listener) {
			throw new Error(
				"EventListner must have both event and listener defined. Use .event() and .run() before calling .on()",
			);
		}
		const listener = this._listener;
		const event = this._event;
		client.on(event, (...args: ClientEvents[K]) => {
			listener(client, ...args);
		});
	}

	public getEvent(): K | undefined {
		return this._event;
	}

	public getListener(): ((client: Client, ...args: ClientEvents[K]) => void) | undefined {
		return this._listener;
	}
}
