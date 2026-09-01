import { defaultComponentRegistry } from '../registry/component-registry';
import { validateAiBuilderActions } from './validate-actions';

describe('validateAiBuilderActions', () => {
  it('accepts add_node for a known type', () => {
    const result = validateAiBuilderActions(
      [{ op: 'add_node', type: 'visual.table', ref: 'table1' }],
      defaultComponentRegistry,
      [],
    );
    expect(result.valid).toBe(true);
    expect(result.applicableActions).toHaveLength(1);
  });

  it('rejects unknown component types', () => {
    const result = validateAiBuilderActions(
      [{ op: 'add_node', type: 'not.real' }],
      defaultComponentRegistry,
      [],
    );
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.message).toContain('Unknown component type');
  });

  it('rejects bind actions with non-text ports instead of throwing', () => {
    expect(() =>
      validateAiBuilderActions(
        [
          {
            op: 'bind',
            sourceRef: 'table1',
            sourcePort: true,
            targetRef: 'chart1',
            targetPort: 'data',
          } as never,
        ],
        defaultComponentRegistry,
        [],
      ),
    ).not.toThrow();

    const result = validateAiBuilderActions(
      [
        {
          op: 'bind',
          sourceNodeId: 'n1',
          sourcePort: {},
          targetNodeId: 'n2',
          targetPort: 'data',
        } as never,
      ],
      defaultComponentRegistry,
      [
        {
          id: 'n1',
          type: 'visual.table',
          label: 'Table',
          outputs: ['rowset'],
          inputs: [],
        },
        {
          id: 'n2',
          type: 'visual.chart.line',
          label: 'Chart',
          outputs: [],
          inputs: ['data'],
        },
      ],
    );
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.message).toContain('sourcePort and targetPort');
  });
});
