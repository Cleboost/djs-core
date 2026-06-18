import type { ModalSubmitInteraction } from "discord.js";
import type Modal from "../interaction/Modal";
import BaseHandler from "./BaseHandler";

export default class ModalHandler extends BaseHandler<
	Modal,
	ModalSubmitInteraction
> {
	public async onModalSubmit(
		interaction: ModalSubmitInteraction,
	): Promise<void> {
		await this.dispatch(interaction);
	}
}
