import { defineConfig } from "@djs-core/runtime";

if (!process.env.TOKEN) {
	throw new Error("TOKEN environment variable is required");
}

export default defineConfig({
	token: process.env.TOKEN,
	servers: ["1333211545920077896"],
	db: {
		dialect: "postgresql",
		autoMigrate: true,
	},
});
