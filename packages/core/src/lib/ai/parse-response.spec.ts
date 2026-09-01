import { normalizeAiBuilderActions } from './normalize-actions';
import { parseAiBuilderResponse } from './parse-response';
import { validateAiBuilderActions } from './validate-actions';
import { defaultComponentRegistry } from '../registry/component-registry';

describe('normalizeAiBuilderActions', () => {
  it('maps common bind field aliases', () => {
    const actions = normalizeAiBuilderActions([
      {
        op: 'bind',
        sourceRef: 'table1',
        sourcePortId: 'rowset',
        targetRef: 'chart1',
        targetPortId: 'data',
      },
    ]);

    expect(actions[0]).toMatchObject({
      op: 'bind',
      sourcePort: 'rowset',
      targetPort: 'data',
    });
  });
});

describe('parseAiBuilderResponse', () => {
  it('parses bare JSON', () => {
    const parsed = parseAiBuilderResponse(
      JSON.stringify({
        summary: 'Added a table',
        actions: [{ op: 'add_node', type: 'visual.table', ref: 't1' }],
      }),
    );
    expect(parsed.summary).toBe('Added a table');
    expect(parsed.actions).toHaveLength(1);
  });

  it('parses fenced JSON', () => {
    const parsed = parseAiBuilderResponse(
      'Here you go:\n```json\n{"summary":"ok","actions":[]}\n```',
    );
    expect(parsed.summary).toBe('ok');
  });

  it('accepts object port refs after normalization and validation', () => {
    const parsed = parseAiBuilderResponse(
      JSON.stringify({
        summary: 'Bind table to chart',
        actions: [
          {
            op: 'bind',
            sourceRef: 'table1',
            sourcePort: { id: 'rowset' },
            targetRef: 'chart1',
            targetPort: 'data',
          },
        ],
      }),
    );

    const validation = validateAiBuilderActions(
      parsed.actions,
      defaultComponentRegistry,
      [],
    );

    expect(validation.valid).toBe(false);
    expect(validation.issues[0]?.message).toContain('source and target node identifiers');
  });
});
