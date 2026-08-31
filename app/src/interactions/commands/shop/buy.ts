import { Command } from "@djs-core/runtime";
import { eq, gt, schema } from "#db";

export default new Command()
	.setDescription("Buy a product from the shop")
	.addIntegerOption((opt) =>
		opt
			.setName("id")
			.setDescription("The ID of the product to buy")
			.setRequired(false),
	)
	.run(async (interaction) => {
		const id = interaction.options.getInteger("id");

		if (!id) {
			const available = await interaction.client.db
				.select()
				.from(schema.products)
				.where(gt(schema.products.stock, 0));

			if (available.length === 0) {
				return interaction.reply("🏪 The shop is currently out of stock.");
			}

			const list = available
				.map(
					(p) =>
						`\`#${p.id}\` **${p.name}** — ${p.price} coins (${p.stock} left)`,
				)
				.join("\n");
			return interaction.reply(
				`🛒 **Shop — Available Products:**\n${list}\n\nUse \`/shop buy id:<id>\` to purchase.`,
			);
		}

		const [product] = await interaction.client.db
			.select()
			.from(schema.products)
			.where(eq(schema.products.id, id));

		if (!product) {
			return interaction.reply(`❌ Product \`#${id}\` not found.`);
		}
		if (product.stock <= 0) {
			return interaction.reply(`❌ **${product.name}** is out of stock.`);
		}

		await interaction.client.db
			.update(schema.products)
			.set({ stock: product.stock - 1 })
			.where(eq(schema.products.id, id));

		return interaction.reply(
			`✅ You bought **${product.name}** for **${product.price} coins**! (${product.stock - 1} left in stock)`,
		);
	});
