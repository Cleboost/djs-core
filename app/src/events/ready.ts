import { EventListener } from "@djs-core/runtime";
import { ActivityType, Events } from "discord.js";

export default new EventListener().event(Events.ClientReady).run((client) => {
	client.user.setActivity({ name: "🥖 bread", type: ActivityType.Custom });

	// Initialize SQL Database
	console.log("[SQL] Initializing database...");
	client.sql.run(`
		CREATE TABLE IF NOT EXISTS todos (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			task TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);
});
