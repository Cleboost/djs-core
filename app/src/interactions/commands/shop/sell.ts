import { Command } from "@djs-core/runtime";
import { eq } from "drizzle-orm";
import { products } from "../../../db/schema";

export default new Command()
	.setDescription("Sell a product back to the shop")
	.addIntegerOption((opt) =>
		opt
			.setName("id")
			.setDescription("The ID of the product to sell back")
			.setRequired(true),
	)
	.run(async (interaction) => {
		const id = interaction.options.getInteger("id", true);

		const [product] = await interaction.client.drizzle
			.select()
			.from(products)
			.where(eq(products.id, id));

		if (!product) {
			return interaction.reply(`❌ Product \`#${id}\` not found.`);
		}

		const sellPrice = Math.floor(product.price * 0.6);

		await interaction.client.drizzle
			.update(products)
			.set({ stock: product.stock + 1 })
			.where(eq(products.id, id));

		return interaction.reply(
			`💰 You sold **${product.name}** for **${sellPrice} coins** (60% of ${product.price}).`,
		);
	});
