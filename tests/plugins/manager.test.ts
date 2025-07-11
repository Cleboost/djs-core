import { describe, it, expect, spyOn } from 'bun:test';
import { PluginManager } from '../../src/plugins/manager.ts';
import type { DjsCorePlugin } from '../../src/plugins/types.ts';
import { mkdtempSync, writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('PluginManager.ensureRuntimeDeps', () => {
  it('injects dependencies and exits', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'djscore-'));
    const pkgPath = join(tmp, 'package.json');
    writeFileSync(pkgPath, JSON.stringify({ name: 'tmp', version: '1.0.0' }));

    const plugin: DjsCorePlugin = {
      name: 'fake',
      runtimeDeps: { lodash: '^4.17.21' },
      devDeps: { typescript: '^5.0.0' },
    };

    const manager = new PluginManager([plugin]);

    const exitSpy = spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });

    try {
      await (manager as any).ensureRuntimeDeps(tmp);
    } catch (e) {
      /* swallow */
    }

    const contents = JSON.parse(readFileSync(pkgPath, 'utf8'));
    expect(contents.dependencies.lodash).toBe('^4.17.21');
    expect(contents.devDependencies.typescript).toBe('^5.0.0');
  })
  ;
}); 