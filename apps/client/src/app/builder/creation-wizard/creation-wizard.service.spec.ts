import { TestBed } from '@angular/core/testing';
import { defaultComponentRegistry } from '@rosettadash/core';
import { BuilderAssistanceService } from '../builder-assistance.service';
import { BuilderStateService } from '../builder-state.service';
import { CreationWizardService } from './creation-wizard.service';

describe('CreationWizardService', () => {
  let service: CreationWizardService;

  beforeEach(() => {
    sessionStorage.clear();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    TestBed.configureTestingModule({
      providers: [CreationWizardService, BuilderStateService, BuilderAssistanceService],
    });
    service = TestBed.inject(CreationWizardService);
  });

  it('opens the wizard in mode-choice phase on an empty canvas', () => {
    service.openWizard();
    expect(service.open()).toBe(true);
    expect(service.phase()).toBe('mode-choice');
  });

  it('does not auto-show the welcome banner after permanent dismiss', () => {
    service.closeWizard(true);
    expect(service.shouldAutoShowWelcomeBanner()).toBe(false);
  });

  it('excludes explore from guided goals', () => {
    service.openWizard();
    service.startGuidedCreation();
    expect(service.guidedGoals().some((goal) => goal.id === 'explore')).toBe(false);
  });

  it('highlights wasm-compute on the final media pipeline step', () => {
    service.openWizard();
    service.startGuidedCreation();
    service.selectGoal('media-wasm');
    expect(service.highlightGroupId()).toBe('media-authoring');
    service.advanceStep();
    service.advanceStep();
    expect(service.highlightGroupId()).toBe('wasm-compute');
  });

  it('opens extend phase when the canvas already has components', () => {
    const state = TestBed.inject(BuilderStateService);
    const definition = defaultComponentRegistry.get('visual.kpi');
    if (!definition) {
      throw new Error('Expected visual.kpi in default registry');
    }
    state.addNodeFromDefinition(definition);
    service.openWizard();
    expect(service.phase()).toBe('extend');
  });

  it('chooseInspectorOnlyFromBanner disables How it works assistance', () => {
    service.enableHowItWorksFromBanner();
    expect(service.showWelcomeBanner()).toBe(false);

    service.showWelcomeBanner.set(true);
    service.chooseInspectorOnlyFromBanner();
    expect(TestBed.inject(BuilderAssistanceService).isHowItWorksEnabled()).toBe(false);
    expect(service.showExploreTips()).toBe(false);
  });

  it('selectGoal clears existing canvas nodes before guided steps', () => {
    const state = TestBed.inject(BuilderStateService);
    state.addNodeFromDefinition(defaultComponentRegistry.getOrThrow('visual.kpi'));
    expect(state.nodes()).toHaveLength(1);

    service.selectGoal('filter-table-chart');
    expect(service.phase()).toBe('steps');
    expect(state.nodes()).toHaveLength(0);
    expect(state.composite()?.templateId).toBeUndefined();
  });

  it('finishing steps arranges a dashboard grid and auto-wires bindings', () => {
    const state = TestBed.inject(BuilderStateService);
    state.setProjectContext(
      {
        id: 'p1',
        name: 'Test',
        composites: [],
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'c1',
        name: 'Main',
        nodes: [],
        bindings: [],
        version: 1,
      },
    );
    service.selectGoal('filter-table-chart');
    service.addSuggestedComponent();
    expect(state.nodes()).toHaveLength(1);
    service.advanceStep();
    service.addSuggestedComponent();
    service.advanceStep();
    service.addSuggestedComponent();
    service.advanceStep();
    expect(service.phase()).toBe('arrange');
    expect(service.arrangeMessage()).toContain('drag them where you want');
    expect(state.composite()?.name).toBe('FilterTableChart');

    const filter = state.nodes().find((node) => node.type === 'visual.input.date-range');
    const table = state.nodes().find((node) => node.type === 'visual.table');
    const chart = state.nodes().find((node) => node.type === 'visual.chart.line');
    expect(filter && table && chart).toBeTruthy();
    expect(filter!.layout?.y).toBeLessThan(table!.layout?.y ?? 0);
    expect(table!.layout?.x).toBeLessThan(chart!.layout?.x ?? 0);
    expect(table!.layout?.y).toBe(chart!.layout?.y);
    expect(
      state.bindings().some(
        (binding) =>
          binding.sourceNodeId === filter!.id &&
          binding.targetNodeId === table!.id &&
          binding.targetPortId === 'filter',
      ),
    ).toBe(true);
    expect(
      state.bindings().some(
        (binding) =>
          binding.sourceNodeId === filter!.id &&
          binding.targetNodeId === chart!.id &&
          binding.targetPortId === 'range',
      ),
    ).toBe(true);
  });
});
