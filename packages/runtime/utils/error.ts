import { MessageFlags } from "discord.js";
import { runtimeLog } from "./logger";

/**
 * Simple interface for repliable interactions.
 */
interface Repliable {
	isRepliable(): boolean;
	replied: boolean;
	deferred: boolean;
	reply(options: unknown): Promise<unknown>;
	followUp(options: unknown): Promise<unknown>;
}

/**
 * Type guard to check if an interaction is repliable.
 */
function isRepliable(interaction: unknown): interaction is Repliable {
	return (
		!!interaction &&
		typeof interaction === "object" &&
		"isRepliable" in interaction &&
		typeof (interaction as { isRepliable: unknown }).isRepliable ===
			"function" &&
		(interaction as { isRepliable: () => boolean }).isRepliable()
	);
}

/**
 * Handles an error that occurred during an interaction.
 * Logs the error and sends a user-friendly message to the user.
 */
export async function handleInteractionError(
	interaction: unknown,
	error: unknown,
): Promise<void> {
	runtimeLog.error("Interaction handler failed", error);

	if (!isRepliable(interaction)) {
		return;
	}

	const content = "There was an error while executing this interaction!";
	const flags = MessageFlags.Ephemeral;

	try {
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content, flags });
		} else {
			await interaction.reply({ content, flags });
		}
	} catch (e) {
		runtimeLog.error("Failed to send error reply", e);
	}
}
