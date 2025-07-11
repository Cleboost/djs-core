import { describe, it, expect } from 'bun:test';
import { registerHandlers } from '../../src/runtime/handler.ts';
import { Command } from '../../src/runtime/Class/Command.ts';

class DummyCommand extends Command {
  constructor() {
    super();
    this.setName('ping').setDescription('Ping');
  }
}

describe('registerHandlers', () => {
  it('attaches maps to client', () => {
    const dummyCmd = new DummyCommand();
    const fakeClient: any = {
      on: () => {},
      once: () => {},
    };

    registerHandlers({ client: fakeClient, commands: [dummyCmd] });
    expect(fakeClient._djsCommands).toBeDefined();
    expect(fakeClient._djsCommands.get('ping')).toBe(dummyCmd);
  });
}); 