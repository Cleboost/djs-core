import { SlashCommandBuilder } from "discord.js";

export class SubCommandGroup {
  private builder: SlashCommandBuilder;
  public name: string;
  public description: string;

  constructor() {
    this.builder = new SlashCommandBuilder();
    this.name = "";
    this.description = "";
  }

  /**
   * Set the name of the subcommand group
   * @param name - The name of the subcommand group
   * @returns The subcommand group
   */
  setName(name: string) {
    this.name = name;
    this.builder.setName(name);
    return this;
  }

  /**
   * Set the description of the subcommand group
   * @param description - The description of the subcommand group
   * @returns The subcommand group
   */
  setDescription(description: string) {
    this.description = description;
    this.builder.setDescription(description);
    return this;
  }

  toJSON() {
    return this.builder.toJSON();
  }
}