import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseCompanionArgs } from './orchestration-args.mjs';

describe('parseCompanionArgs', () => {
  it('defaults target to serve', () => {
    assert.deepEqual(parseCompanionArgs(['node', 'script.mjs', 'proof-react']), {
      project: 'proof-react',
      target: 'serve',
    });
  });

  it('reads storybook target', () => {
    assert.deepEqual(
      parseCompanionArgs([
        'node',
        'script.mjs',
        'storybook-react',
        '--target',
        'storybook',
      ]),
      { project: 'storybook-react', target: 'storybook' },
    );
  });

  it('rejects missing project', () => {
    assert.deepEqual(parseCompanionArgs(['node', 'script.mjs']), {
      error: 'missing project',
    });
  });

  it('rejects empty --target value', () => {
    assert.deepEqual(parseCompanionArgs(['node', 'script.mjs', 'proof-react', '--target']), {
      error: 'missing --target value',
    });
  });

  it('rejects unknown target', () => {
    assert.deepEqual(
      parseCompanionArgs(['node', 'script.mjs', 'proof-react', '--target', 'build']),
      { error: 'invalid target: build' },
    );
  });
});
