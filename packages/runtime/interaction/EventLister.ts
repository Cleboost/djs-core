import type { Client, ClientEvents } from "discord.js";

export default class EventLister<
	K extends keyof ClientEvents = keyof ClientEvents,
> {
	private _event?: K;
	private _listener?: (...args: ClientEvents[K]) => void;

	public event<EventKey extends keyof ClientEvents>(
		event: EventKey,
	): EventLister<EventKey> {
		const newLister = new EventLister<EventKey>();
		newLister._event = event;
		return newLister;
	}

	public run(listener: (...args: ClientEvents[K]) => void): this {
		this._listener = listener;
		return this;
	}

	public on(client: Client): void {
		if (!this._event || !this._listener) {
			throw new Error(
				"EventLister must have both event and listener defined. Use .event() and .run() before calling .on()",
			);
		}
		client.on(this._event, this._listener);
	}

	public getEvent(): K | undefined {
		return this._event;
	}

	public getListener(): ((...args: ClientEvents[K]) => void) | undefined {
		return this._listener;
	}
}
