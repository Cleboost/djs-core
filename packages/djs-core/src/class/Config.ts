export default class Config {
  private config: ConfigType = {};
  constructor(config: ConfigType) {
    this.config = config;
  }
  getConfig(): ConfigType {
    return this.config;
  }
}

/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

export interface ConfigType {
  // Pas sur de ce que je fais donc a revoir en voc discord
  // permission: {
  //     roles: {
  //         [roleName: string]: Snowflake;
  //     }
  //     categories: {
  //         [categoryName: string]: Snowflake;
  //     }
  // }
  logger?: {
    /**
     * Log all command executed
     * @default false
     * @type {boolean}
     */
    logCmd?: boolean;
    /**
     * Log all button clicked
     * @default false
     * @type {boolean}
     */
    logBtn?: boolean;
    /**
     * Log all select menu selected
     * @default false
     * @type {boolean}
     */
    logSelect?: boolean;
    /**
     * Log all event handled created
     * @default false
     * @type {boolean}
     */
    logEvent?: boolean;
  };
}
