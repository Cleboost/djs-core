import { describe, it, expect, beforeEach, spyOn } from 'bun:test';

import * as cp from 'child_process';

const spawnSpy = spyOn(cp, 'spawn').mockImplementation((() => ({} as any)) as unknown as typeof cp.spawn);

const dummyExec = ((..._args: any[]) => undefined) as unknown as typeof cp.execFile;
(dummyExec as any).__promisify__ = () => {};
const execFileSpy = spyOn(cp, 'execFile').mockImplementation(dummyExec);

import { openFile } from '../../src/cli/utils/openFile.ts';

describe('openFile', () => {
  beforeEach(() => {
    spawnSpy.mock.calls.length = 0;
    execFileSpy.mock.calls.length = 0;
  });

  it('uses spawn with VISUAL/EDITOR when set', () => {
    process.env.EDITOR = 'myeditor';
    openFile('test.txt');
    expect(spawnSpy.mock.calls.length).toBe(1);
    delete process.env.EDITOR;
  });

  it('falls back to cmd start on win32', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });
    openFile('test.txt');
    expect(execFileSpy.mock.calls.length).toBeGreaterThan(0);
    expect(execFileSpy.mock.calls[0]![0]).toBe('cmd');
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('uses xdg-open on linux', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });
    openFile('test.txt');
    expect(execFileSpy.mock.calls.length).toBeGreaterThan(0);
    expect(execFileSpy.mock.calls[0]![0]).toBe('xdg-open');
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });
}); 