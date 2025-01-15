/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

const {BotClient}  = require("../dist/index");

jest.mock("discord.js", () => {
  const actualDiscordJs = jest.requireActual("discord.js");
  return {
    ...actualDiscordJs,
    Client: jest.fn().mockImplementation(() => {
      return {
        login: jest.fn().mockImplementation(() => {
          throw new Error("An invalid token was provided.");
        }),
        on: jest.fn(),
      };
    }),
  };
});

describe("BotClient", () => {
  let consoleSpy;
  let exitSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {
      // Capture les messages de la console
    });
    exitSpy = jest.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit: ${code}`);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should log an error if the token is invalid", async () => {
    const botClient = new BotClient(); // Passez un token vide pour simuler l'erreur
    try {
      await botClient.start();
    } catch (error) {
      console.log("Caught error:", error.message);
    }
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Config is not loaded correctly"));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});