import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ensureBuilderApi,
  stopBuilderServer,
} from './builder-process.mjs';

describe('stopBuilderServer', () => {
  it('no-ops when child is null', () => {
    assert.doesNotThrow(() => stopBuilderServer(null, 'test'));
  });

  it('no-ops when child is already killed', () => {
    const child = { killed: true, exitCode: null, kill() {} };
    assert.doesNotThrow(() => stopBuilderServer(child, 'test'));
  });

  it('no-ops when child already exited', () => {
    const child = { killed: false, exitCode: 0, kill() {} };
    assert.doesNotThrow(() => stopBuilderServer(child, 'test'));
  });

  it('sends SIGTERM when child is running', () => {
    let signal = null;
    const child = {
      killed: false,
      exitCode: null,
      kill(nextSignal) {
        signal = nextSignal;
      },
    };

    stopBuilderServer(child, 'unit-test');
    assert.equal(signal, 'SIGTERM');
  });
});

describe('ensureBuilderApi', () => {
  it('reuses an existing builder without starting one', async () => {
    let startCalls = 0;

    const result = await ensureBuilderApi({
      quiet: true,
      checkUp: async () => true,
      start: () => {
        startCalls += 1;
        return {};
      },
      wait: async () => {
        throw new Error('wait should not run when API is already up');
      },
    });

    assert.equal(startCalls, 0);
    assert.deepEqual(result, { child: null, started: false });
  });

  it('starts and waits when the builder is down', async () => {
    const child = { id: 'builder-child' };
    const events = [];

    const result = await ensureBuilderApi({
      quiet: true,
      checkUp: async () => false,
      start: () => {
        events.push('start');
        return child;
      },
      wait: async (startedChild) => {
        events.push(`wait:${startedChild.id}`);
      },
    });

    assert.deepEqual(events, ['start', 'wait:builder-child']);
    assert.equal(result.child, child);
    assert.equal(result.started, true);
  });
});
