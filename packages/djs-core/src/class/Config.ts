export default class Config {
  private configLogger: ConfigLogger = new ConfigLogger();
  constructor() {}
  public logger() {
    return this.configLogger;
  }

  public getConfig() {
    return {
      logger: {
        logCmd: this.configLogger.logCmd,
      },
    };
  }
}

class ConfigLogger {
  protected logCmd: boolean = false;
  constructor() {}

  setLogCmd(value: boolean) {
    this.logCmd = value;
  }
}
