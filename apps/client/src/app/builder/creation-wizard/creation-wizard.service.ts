import { Injectable, computed, inject, signal } from '@angular/core';
import {
  CreationGoalId,
  CreationWizardStep,
  DashboardExtensionTopic,
  defaultComponentRegistry,
  getCreationGoal,
  listCreationGoals,
  listDashboardExtensionTopics,
  paletteGroupColor,
  type PaletteGroupColor,
} from '@rosettadash/core';
import { BuilderAssistanceService } from '../builder-assistance.service';
import { BuilderStateService } from '../builder-state.service';
import { estimateCanvasNodeHeight } from '../canvas/canvas-viewport';
import {
  computeGuidedBindings,
  computeGuidedDashboardLayout,
} from './guided-dashboard-layout';

const SESSION_DISMISS_KEY = 'rosettadash:creation-wizard:dismissed';
const CLOSE_ANIMATION_MS = 420;
const CREATE_HINT_MS = 4500;
const ARRANGE_MARGIN = 24;
const ARRANGE_GAP = 24;
const ARRANGE_COLUMN_WIDTH = 320;

export type CreationWizardPhase =
  | 'closed'
  | 'mode-choice'
  | 'self-explore'
  | 'intent'
  | 'ai-choice'
  | 'steps'
  | 'arrange'
  | 'extend';

@Injectable({ providedIn: 'root' })
export class CreationWizardService {
  private readonly state = inject(BuilderStateService);
  private readonly assistance = inject(BuilderAssistanceService);

  readonly open = signal(false);
  readonly closing = signal(false);
  readonly highlightCreateButton = signal(false);
  readonly showWelcomeBanner = signal(false);
  readonly showExploreTips = signal(false);
  readonly phase = signal<CreationWizardPhase>('closed');
  readonly selectedGoalId = signal<CreationGoalId | null>(null);
  readonly selectedExtensionId = signal<string | null>(null);
  readonly stepIndex = signal(0);
  readonly wantsAi = signal(false);
  readonly metaComponentName = signal('CustomObject');
  readonly arrangeMessage = signal('');

  readonly guidedGoals = computed(() =>
    listCreationGoals().filter((goal) => goal.id !== 'explore'),
  );

  readonly extensionTopics = listDashboardExtensionTopics();

  readonly activeGoal = computed(() => {
    const goalId = this.selectedGoalId();
    return goalId ? getCreationGoal(goalId) : null;
  });

  readonly activeExtension = computed((): DashboardExtensionTopic | null => {
    const id = this.selectedExtensionId();
    if (!id) {
      return null;
    }
    return this.extensionTopics.find((topic) => topic.id === id) ?? null;
  });

  readonly activeStep = computed((): CreationWizardStep | null => {
    const goal = this.activeGoal();
    if (!goal || goal.steps.length === 0) {
      return null;
    }
    return goal.steps[this.stepIndex()] ?? null;
  });

  readonly highlightGroupId = computed(() => this.activeStep()?.highlightGroupId ?? null);

  readonly highlightTypes = computed(() => new Set(this.activeStep()?.highlightTypes ?? []));

  readonly highlightColor = computed((): PaletteGroupColor | null => {
    const groupId = this.highlightGroupId();
    return groupId ? paletteGroupColor(groupId) : null;
  });

  readonly progressLabel = computed(() => {
    const goal = this.activeGoal();
    if (!goal || goal.steps.length === 0) {
      return '';
    }
    return `Step ${this.stepIndex() + 1} of ${goal.steps.length}`;
  });

  readonly stepComplete = computed(() => {
    const step = this.activeStep();
    if (!step) {
      return true;
    }
    const types = new Set(this.state.nodes().map((node) => node.type));
    return step.completeWhenTypes.some((type) => types.has(type));
  });

  readonly reactImportHint = computed(() => {
    const name = this.sanitizeComponentName(this.metaComponentName());
    return `import ${name} from './src/${name}';`;
  });

  shouldAutoShowWelcomeBanner(): boolean {
    if (sessionStorage.getItem(SESSION_DISMISS_KEY) === '1') {
      return false;
    }
    return this.state.nodes().length === 0 && !this.state.loading();
  }

  /** @deprecated use shouldAutoShowWelcomeBanner — kept for tests */
  shouldAutoOpen(): boolean {
    return this.shouldAutoShowWelcomeBanner();
  }

  openWizard(): void {
    this.showWelcomeBanner.set(false);
    this.open.set(true);
    this.closing.set(false);
    this.selectedGoalId.set(null);
    this.selectedExtensionId.set(null);
    this.stepIndex.set(0);
    this.wantsAi.set(false);
    this.arrangeMessage.set('');
    this.phase.set(this.state.nodes().length > 0 ? 'extend' : 'mode-choice');
  }

  openGuidedWizard(): void {
    this.showWelcomeBanner.set(false);
    this.open.set(true);
    this.closing.set(false);
    this.selectedGoalId.set(null);
    this.selectedExtensionId.set(null);
    this.stepIndex.set(0);
    this.wantsAi.set(false);
    this.arrangeMessage.set('');
    this.phase.set('intent');
  }

  /** @deprecated use chooseInspectorOnlyFromBanner */
  startSelfExplorationFromBanner(): void {
    this.chooseInspectorOnlyFromBanner();
  }

  chooseInspectorOnlyFromBanner(): void {
    this.assistance.chooseInspectorOnly();
    this.showWelcomeBanner.set(false);
    this.showExploreTips.set(false);
  }

  enableHowItWorksFromBanner(): void {
    this.assistance.enableHowItWorksAssistance();
    this.showWelcomeBanner.set(false);
    this.showExploreTips.set(false);
  }

  dismissWelcomeBanner(permanent = false): void {
    if (permanent) {
      sessionStorage.setItem(SESSION_DISMISS_KEY, '1');
    }
    this.showWelcomeBanner.set(false);
  }

  dismissExploreTips(): void {
    this.showExploreTips.set(false);
  }

  startGuidedCreation(): void {
    this.phase.set('intent');
  }

  startSelfExploration(): void {
    this.phase.set('self-explore');
  }

  finishSelfExploration(): void {
    this.showExploreTips.set(true);
    this.closeWizardWithHint();
  }

  selectExtensionTopic(topicId: string): void {
    this.selectedExtensionId.set(topicId);
  }

  closeWizardWithHint(permanentBannerDismiss = false): void {
    if (!this.open()) {
      return;
    }
    if (permanentBannerDismiss) {
      sessionStorage.setItem(SESSION_DISMISS_KEY, '1');
      this.showWelcomeBanner.set(false);
    }
    this.closing.set(true);
    window.setTimeout(() => {
      this.finalizeClose();
      this.closing.set(false);
      this.pulseCreateButton();
    }, CLOSE_ANIMATION_MS);
  }

  closeWizard(dismiss = false): void {
    if (dismiss) {
      sessionStorage.setItem(SESSION_DISMISS_KEY, '1');
      this.showWelcomeBanner.set(false);
    }
    this.finalizeClose();
  }

  selectGoal(goalId: CreationGoalId): void {
    this.selectedGoalId.set(goalId);
    const goal = getCreationGoal(goalId);

    // Start from a clean canvas — no leftover example under guided pieces.
    this.state.clearCanvas();
    this.metaComponentName.set(this.defaultMetaNameForGoal(goalId));

    if (goal.steps.length === 0) {
      this.phase.set('ai-choice');
      return;
    }

    this.stepIndex.set(0);
    this.phase.set('steps');
    this.expandPaletteGroup(goal.steps[0]?.highlightGroupId);
  }

  chooseAiAssist(enabled: boolean): void {
    this.wantsAi.set(enabled);
    this.closeWizardWithHint();
  }

  skipAiChoice(): void {
    this.wantsAi.set(false);
    this.closeWizardWithHint();
  }

  advanceStep(): void {
    const goal = this.activeGoal();
    if (!goal) {
      return;
    }

    const nextIndex = this.stepIndex() + 1;
    if (nextIndex >= goal.steps.length) {
      this.enterArrangePhase();
      return;
    }

    this.stepIndex.set(nextIndex);
    this.expandPaletteGroup(goal.steps[nextIndex]?.highlightGroupId);
  }

  goBackStep(): void {
    const index = this.stepIndex();
    if (index <= 0) {
      this.phase.set('intent');
      this.selectedGoalId.set(null);
      return;
    }
    const goal = this.activeGoal();
    const nextIndex = index - 1;
    this.stepIndex.set(nextIndex);
    this.expandPaletteGroup(goal?.steps[nextIndex]?.highlightGroupId);
  }

  goBackFromIntent(): void {
    this.phase.set('mode-choice');
    this.selectedGoalId.set(null);
  }

  goBackFromExtend(): void {
    this.phase.set('mode-choice');
    this.selectedExtensionId.set(null);
  }

  goBackFromArrange(): void {
    const goal = this.activeGoal();
    if (!goal || goal.steps.length === 0) {
      this.phase.set('intent');
      return;
    }
    this.stepIndex.set(goal.steps.length - 1);
    this.phase.set('steps');
    this.expandPaletteGroup(goal.steps.at(-1)?.highlightGroupId);
  }

  addSuggestedComponent(): void {
    const step = this.activeStep();
    if (!step?.suggestedType) {
      return;
    }
    const definition = defaultComponentRegistry.get(step.suggestedType);
    if (!definition) {
      return;
    }

    const existing = this.state.nodes();
    let nextY = ARRANGE_MARGIN;
    for (const node of existing) {
      const top = node.layout?.y ?? ARRANGE_MARGIN;
      const height = estimateCanvasNodeHeight(node);
      nextY = Math.max(nextY, top + height + ARRANGE_GAP);
    }

    this.state.addNodeFromDefinition(definition, {
      layout: {
        x: ARRANGE_MARGIN,
        y: nextY,
        width: ARRANGE_COLUMN_WIDTH,
      },
    });
  }

  /** Animate pieces into a dashboard grid, auto-wire bindings, then prompt save. */
  enterArrangePhase(): void {
    this.wireGuidedBindings();
    this.arrangeGuidedNodes();
    this.applyMetaComponentName(this.metaComponentName());
    this.arrangeMessage.set(
      'Bindings are wired and components are arranged — drag them where you want, then press Save when done.',
    );
    this.phase.set('arrange');
  }

  setMetaComponentName(name: string): void {
    this.metaComponentName.set(name);
  }

  applyMetaComponentName(name: string): void {
    const sanitized = this.sanitizeComponentName(name);
    this.metaComponentName.set(sanitized);
    const composite = this.state.composite();
    if (!composite) {
      return;
    }
    this.state.composite.set({
      ...composite,
      name: sanitized,
      templateId: undefined,
    });
    this.state.dirty.set(true);
  }

  finishArrangeAndClose(): void {
    this.applyMetaComponentName(this.metaComponentName());
    this.closeWizardWithHint();
  }

  aiPromptForGoal(): string {
    const extension = this.activeExtension();
    if (extension?.aiPromptHint) {
      return extension.aiPromptHint;
    }
    return this.activeGoal()?.aiPromptHint ?? 'Help me build on this canvas.';
  }

  isTypeHighlighted(type: string): boolean {
    return this.open() && this.phase() === 'steps' && this.highlightTypes().has(type);
  }

  isGroupHighlighted(groupId: string): boolean {
    return this.open() && this.phase() === 'steps' && this.highlightGroupId() === groupId;
  }

  private arrangeGuidedNodes(): void {
    const layoutById = computeGuidedDashboardLayout(this.state.nodes());
    if (layoutById.size === 0) {
      return;
    }
    this.state.updateNodesLayoutBatch(layoutById);
  }

  private wireGuidedBindings(): void {
    for (const spec of computeGuidedBindings(this.state.nodes())) {
      this.state.createBinding(
        spec.sourceNodeId,
        spec.sourcePortId,
        spec.targetNodeId,
        spec.targetPortId,
      );
    }
  }

  private defaultMetaNameForGoal(goalId: CreationGoalId): string {
    switch (goalId) {
      case 'dashboard':
        return 'AnalyticsOverview';
      case 'filter-table-chart':
        return 'FilterTableChart';
      case 'media-wasm':
        return 'MediaPipeline';
      case 'single-component':
        return 'CustomObject';
      default:
        return 'CustomObject';
    }
  }

  private sanitizeComponentName(value: string): string {
    const trimmed = value.trim() || 'CustomObject';
    const withoutInvalid = trimmed.replace(/[^A-Za-z0-9_]/g, '');
    const withLeading = /^[A-Za-z_]/.test(withoutInvalid)
      ? withoutInvalid
      : `Custom${withoutInvalid || 'Object'}`;
    return withLeading.slice(0, 64);
  }

  private pulseCreateButton(): void {
    this.highlightCreateButton.set(true);
    window.setTimeout(() => this.highlightCreateButton.set(false), CREATE_HINT_MS);
  }

  private finalizeClose(): void {
    this.open.set(false);
    this.phase.set('closed');
    this.selectedGoalId.set(null);
    this.selectedExtensionId.set(null);
    this.stepIndex.set(0);
    this.arrangeMessage.set('');
  }

  private expandPaletteGroup(groupId?: string): void {
    if (!groupId) {
      return;
    }
    window.dispatchEvent(
      new CustomEvent('rosettadash:palette-expand-group', { detail: { groupId } }),
    );
  }
}
