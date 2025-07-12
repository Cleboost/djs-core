import { ContextMenuCommandBuilder, type ContextMenuCommandInteraction, type Client, ApplicationCommandType } from "discord.js";

export type ContextMenuRunFn = (
  client: Client,
  interaction: ContextMenuCommandInteraction,
) => Promise<void> | void;

export class ContextMenu extends ContextMenuCommandBuilder {
  private _run?: ContextMenuRunFn;

  /**
   * Définit la fonction exécutée lorsque le menu contextuel est appelé.
   * @param fn Fonction de rappel
   */
  run(fn: ContextMenuRunFn): this {
    this._run = fn;
    return this;
  }

  /**
   * Enregistre le menu contextuel (facultatif).
   * Identique au pattern des autres classes (Command, Button…)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  register?(_client: Client): Promise<void> | void;

  /**
   * Exécute le menu contextuel.
   * @param interaction L'interaction reçue
   */
  async execute(interaction: ContextMenuCommandInteraction) {
    if (!this._run) {
      throw new Error(`The context menu '${this.name}' has no .run() callback defined`);
    }
    await this._run(interaction.client as Client, interaction);
  }

  // Assure que les méthodes chainables retournent le bon type
  override setName(name: string): this {
    return super.setName(name) as unknown as this;
  }

  override setType(type: ApplicationCommandType): this {
    return super.setType(type) as unknown as this;
  }
} 