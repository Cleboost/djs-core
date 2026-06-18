import type { ButtonInteraction } from "discord.js";
import type Button from "../interaction/Button";
import BaseHandler from "./BaseHandler";

export default class ButtonHandler extends BaseHandler<
	Button,
	ButtonInteraction
> {
	public async onButtonInteraction(
		interaction: ButtonInteraction,
	): Promise<void> {
		await this.dispatch(interaction);
	}
}
