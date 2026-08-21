import {
  CREATION_GOAL_DEFINITIONS,
  getCreationGoal,
  listCreationGoals,
} from './creation-wizard-flows';

describe('creation wizard flows', () => {
  it('lists all creation goals', () => {
    expect(listCreationGoals().length).toBe(CREATION_GOAL_DEFINITIONS.length);
  });

  it('includes a media wasm flow through wasm-compute group', () => {
    const goal = getCreationGoal('media-wasm');
    expect(goal.steps.some((step) => step.highlightGroupId === 'wasm-compute')).toBe(true);
    expect(goal.steps.at(-1)?.completeWhenTypes).toContain('visual.wasm.media');
  });

  it('dashboard and filter flows build piece-by-piece without auto-applying a template', () => {
    expect(getCreationGoal('dashboard').templateId).toBeUndefined();
    expect(getCreationGoal('filter-table-chart').templateId).toBeUndefined();
    expect(getCreationGoal('dashboard').steps.length).toBeGreaterThan(0);
  });
});
