import { type ChatInputCommandInteraction, type Client, SlashCommandBuilder } from "discord.js";
import type {
  SlashCommandBooleanOption,
  SlashCommandChannelOption,
  SlashCommandIntegerOption,
  SlashCommandMentionableOption,
  SlashCommandNumberOption,
  SlashCommandRoleOption,
  SlashCommandStringOption,
  SlashCommandUserOption,
  SlashCommandAttachmentOption,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";
import { SubCommand } from "./Subcommand";
import { SubCommandGroup } from "./SubcommandGroup";

export type CommandRunFn = (
  client: Client,
  interaction: ChatInputCommandInteraction
) => Promise<void> | void;

export class Command extends SlashCommandBuilder {
  private _run?: CommandRunFn;
  private subcommands: Map<string, SubCommand> = new Map();
  private subcommandGroups: Map<string, SubCommandGroup> = new Map();

  run(fn: CommandRunFn): this {
    this._run = fn;
    return this;
  }

  addSubcommand(
    input:
      | SubCommand
      | SlashCommandSubcommandBuilder
      | ((builder: SlashCommandSubcommandBuilder) => SlashCommandSubcommandBuilder),
  ): this {
    if (input instanceof SubCommand) {
      this.subcommands.set(input.name, input);
    }
    return super.addSubcommand(input as any) as unknown as this;
  }

  addSubcommandGroup(
    input:
      | SubCommandGroup
      | SlashCommandSubcommandGroupBuilder
      | ((builder: SlashCommandSubcommandGroupBuilder) => SlashCommandSubcommandGroupBuilder),
  ): this {
    if (input instanceof SubCommandGroup) {
      this.subcommandGroups.set(input.name, input);
    }
    return super.addSubcommandGroup(input as any) as unknown as this;
  }

  getSubcommand(name: string): SubCommand | undefined {
    return this.subcommands.get(name);
  }

  getSubcommandGroup(name: string): SubCommandGroup | undefined {
    return this.subcommandGroups.get(name);
  }

  override setName(name: string): this {
    return super.setName(name) as unknown as this;
  }

  override setDescription(description: string): this {
    return super.setDescription(description) as unknown as this;
  }

  override addStringOption(
    input: SlashCommandStringOption | ((builder: SlashCommandStringOption) => SlashCommandStringOption),
  ): this {
    return super.addStringOption(input as any) as unknown as this;
  }

  override addIntegerOption(
    input: SlashCommandIntegerOption | ((builder: SlashCommandIntegerOption) => SlashCommandIntegerOption),
  ): this {
    return super.addIntegerOption(input as any) as unknown as this;
  }

  override addBooleanOption(
    input: SlashCommandBooleanOption | ((builder: SlashCommandBooleanOption) => SlashCommandBooleanOption),
  ): this {
    return super.addBooleanOption(input as any) as unknown as this;
  }

  override addNumberOption(
    input: SlashCommandNumberOption | ((builder: SlashCommandNumberOption) => SlashCommandNumberOption),
  ): this {
    return super.addNumberOption(input as any) as unknown as this;
  }

  override addUserOption(
    input: SlashCommandUserOption | ((builder: SlashCommandUserOption) => SlashCommandUserOption),
  ): this {
    return super.addUserOption(input as any) as unknown as this;
  }

  override addChannelOption(
    input: SlashCommandChannelOption | ((builder: SlashCommandChannelOption) => SlashCommandChannelOption),
  ): this {
    return super.addChannelOption(input as any) as unknown as this;
  }

  override addRoleOption(
    input: SlashCommandRoleOption | ((builder: SlashCommandRoleOption) => SlashCommandRoleOption),
  ): this {
    return super.addRoleOption(input as any) as unknown as this;
  }

  override addMentionableOption(
    input:
      | SlashCommandMentionableOption
      | ((builder: SlashCommandMentionableOption) => SlashCommandMentionableOption),
  ): this {
    return super.addMentionableOption(input as any) as unknown as this;
  }

  override addAttachmentOption(
    input:
      | SlashCommandAttachmentOption
      | ((builder: SlashCommandAttachmentOption) => SlashCommandAttachmentOption),
  ): this {
    return super.addAttachmentOption(input as any) as unknown as this;
  }

  register?(client: Client): Promise<void> | void;

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommandName = interaction.options.getSubcommand(false);
    const subcommandGroupName = interaction.options.getSubcommandGroup(false);

    if (subcommandGroupName) {
      const group = this.subcommandGroups.get(subcommandGroupName);
      if (!group) {
        throw new Error(`Subcommand group ${subcommandGroupName} not found in command ${this.name}`);
      }
      await group.execute(interaction);
    } else if (subcommandName) {
      const subcommand = this.subcommands.get(subcommandName);
      if (!subcommand) {
        throw new Error(`Subcommand ${subcommandName} not found in command ${this.name}`);
      }
      await subcommand.execute(interaction);
    } else {
      if (!this._run) throw new Error(`The command ${this.name} has no .run() callback defined`);
      await this._run(interaction.client as Client, interaction);
    }
  }
} 