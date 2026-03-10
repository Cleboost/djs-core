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
	console.error(error);

	if (!isRepliable(interaction)) {
		return;
	}

	const content = "There was an error while executing this interaction!";
	const ephemeral = true;

	try {
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content,
				ephemeral,
			});
		} else {
			await interaction.reply({
				content,
				ephemeral,
			});
		}
	} catch (e) {
		console.error("Failed to send error reply:", e);
	}
}
