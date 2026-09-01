import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { Binding, ComponentNode, PlacementPrompt, getGroupingGuide, getInstructionSteps, groupingAnimationLabel, hasInstructionGuide, resolveGroupingAnimationBlocks, type InstructionStep } from '@rosettadash/core';
import { BuilderAssistanceService } from '../builder-assistance.service';
import { BuilderStateService } from '../builder-state.service';
import { BuilderTabNavigationService } from '../builder-tab-navigation.service';
import { CreationWizardService } from '../creation-wizard/creation-wizard.service';
import { PreviewNodeComponent } from '../preview/preview-node.component';
import {
  CANVAS_DEFAULT_NODE_WIDTH,
  CANVAS_MIN_NODE_HEIGHT,
  clampCanvasNodeHeight,
  clampCanvasNodeWidth,
  snapToCanvasGrid,
} from './canvas-layout';
import {
  type CanvasViewport,
  canvasNodeContentMinHeight,
  canvasNodeHeaderHeight,
  canvasNodePreviewHeight,
  computeCanvasContentBounds,
  estimateCanvasNodeHeight,
  filterVisibleCanvasNodes,
} from './canvas-viewport';

const PORT_ROW_HEIGHT = 24;

export interface BindingEdge {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface DragState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  origins: Map<string, { x: number; y: number }>;
}

interface ResizeState {
  pointerId: number;
  nodeId: string;
  originWidth: number;
  originHeight: number;
  startClientX: number;
  startClientY: number;
}

@Component({
  selector: 'app-canvas',
  imports: [PreviewNodeComponent],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss',
})
export class CanvasComponent implements OnInit, AfterViewInit, OnDestroy {
  protected readonly state = inject(BuilderStateService);
  protected readonly creationWizard = inject(CreationWizardService);
  protected readonly assistance = inject(BuilderAssistanceService);
  private readonly tabNav = inject(BuilderTabNavigationService);

  @ViewChild('surface') private surfaceRef?: ElementRef<HTMLElement>;

  private dragState: DragState | null = null;
  private resizeState: ResizeState | null = null;

  @ViewChild('renameInput') private renameInputRef?: ElementRef<HTMLInputElement>;

  protected readonly defaultNodeWidth = CANVAS_DEFAULT_NODE_WIDTH;

  protected readonly viewportScroll = signal<CanvasViewport>({
    left: 0,
    top: 0,
    width: 800,
    height: 600,
  });

  protected readonly renamingNodeId = signal<string | null>(null);
  protected readonly renameDraft = signal('');

  protected readonly visibleCanvasNodes = computed(() =>
    filterVisibleCanvasNodes(
      this.state.nodes(),
      this.viewportScroll(),
      this.state.selectedNodeIdsSet(),
    ),
  );

  protected readonly canvasContentBounds = computed(() =>
    computeCanvasContentBounds(this.state.nodes(), estimateCanvasNodeHeight),
  );

  protected readonly bindingEdges = computed(() => {
    const nodesById = this.state.nodesById();
    const visibleIds = new Set(this.visibleCanvasNodes().map((node) => node.id));
    const selectedIds = this.state.selectedNodeIdsSet();
    const cullEdges = this.state.nodes().length > 50;

    return this.state
      .bindings()
      .filter((binding) => {
        if (!cullEdges) {
          return true;
        }
        const sourceVisible =
          visibleIds.has(binding.sourceNodeId) || selectedIds.has(binding.sourceNodeId);
        const targetVisible =
          visibleIds.has(binding.targetNodeId) || selectedIds.has(binding.targetNodeId);
        return sourceVisible && targetVisible;
      })
      .map((binding) => this.edgeForBinding(binding, nodesById))
      .filter((edge): edge is BindingEdge => edge !== null);
  });

  ngOnInit(): void {
    this.tabNav.setRenameStarter((nodeId) => {
      const node = this.state.nodes().find((item) => item.id === nodeId);
      if (node) {
        this.startRename(node, new Event('tab'));
      }
    });
  }

  ngAfterViewInit(): void {
    this.syncViewport();
  }

  ngOnDestroy(): void {
    this.tabNav.setRenameStarter(null);
  }

  protected syncViewport(): void {
    const surface = this.surfaceRef?.nativeElement;
    if (!surface) {
      return;
    }
    this.viewportScroll.set({
      left: surface.scrollLeft,
      top: surface.scrollTop,
      width: surface.clientWidth,
      height: surface.clientHeight,
    });
  }

  protected onSurfaceScroll(): void {
    this.syncViewport();
  }

  protected promptAnimationLabel(prompt: PlacementPrompt): string {
    return groupingAnimationLabel(prompt.animationKey);
  }

  protected promptAnimationBlocks(prompt: PlacementPrompt): string[] {
    const guide = getGroupingGuide(prompt.sourceType);
    return guide ? resolveGroupingAnimationBlocks(guide) : ['Component', 'Companion'];
  }

  protected promptHasInstructionSteps(prompt: PlacementPrompt): boolean {
    return hasInstructionGuide(prompt.sourceType);
  }

  protected promptOutcome(prompt: PlacementPrompt): string {
    return getGroupingGuide(prompt.sourceType)?.outcomeSummary ?? '';
  }

  protected promptSteps(prompt: PlacementPrompt): InstructionStep[] {
    return getInstructionSteps(prompt.sourceType);
  }

  protected instructionStepClass(step: InstructionStep): string {
    return step.highlight ? `grouping-instruction__step--${step.highlight}` : '';
  }

  protected promptLeft(prompt: PlacementPrompt): number {
    const source = this.state.nodesById().get(prompt.sourceNodeId);
    return (source?.layout?.x ?? 24) + (source?.layout?.width ?? CANVAS_DEFAULT_NODE_WIDTH) + 16;
  }

  protected promptTop(prompt: PlacementPrompt): number {
    const source = this.state.nodesById().get(prompt.sourceNodeId);
    return source?.layout?.y ?? 24;
  }

  protected addCompanionFromPrompt(companionType: string, event: Event): void {
    event.stopPropagation();
    this.state.addCompanionFromPrompt(companionType);
  }

  protected dismissPlacementPrompt(event: Event): void {
    event.stopPropagation();
    this.state.dismissPlacementPrompt();
  }

  protected selectNode(nodeId: string, event: Event): void {
    event.stopPropagation();
    if (event instanceof KeyboardEvent && event.key === ' ') {
      event.preventDefault();
    }
    const additive = event instanceof MouseEvent && event.shiftKey;
    this.state.selectNode(nodeId, { additive });
  }

  protected removeNode(nodeId: string, event: Event): void {
    event.stopPropagation();
    this.state.removeNode(nodeId);
  }

  protected startRename(node: ComponentNode, event: Event): void {
    event.stopPropagation();
    this.renamingNodeId.set(node.id);
    this.renameDraft.set(node.label);
    setTimeout(() => {
      const input = this.renameInputRef?.nativeElement;
      input?.focus();
      input?.select();
    });
  }

  protected onNamePointerDown(node: ComponentNode, event: PointerEvent): void {
    event.stopPropagation();
    if (event.shiftKey) {
      this.state.selectNode(node.id, { additive: true });
      return;
    }
    if (!this.state.selectedNodeIdsSet().has(node.id)) {
      this.state.selectNode(node.id);
    }
  }

  protected onNameDoubleClick(node: ComponentNode, event: Event): void {
    event.stopPropagation();
    this.startRename(node, event);
  }

  protected onNameClick(node: ComponentNode, event: Event): void {
    event.stopPropagation();
  }

  protected onRenameInputEvent(event: Event): void {
    // Keep clicks/pointerdowns inside the rename input from reselecting/dragging the node.
    event.stopPropagation();
  }

  protected onRenameKeydown(node: ComponentNode, event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitRename(node.id);
      return;
    }
    if (event.key === 'Escape') {
      this.cancelRename(event);
      return;
    }
    if (event.key === ' ') {
      return;
    }
    if (event.key === 'Tab') {
      this.tabNav.handleTab(event, {
        fromKey: 'name',
        beforeMove: () => this.commitRename(node.id),
      });
    }
  }

  protected onNodeKeydown(node: ComponentNode, event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }
    // Rename input handles its own Tab (commit + move).
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.matches('[data-testid="canvas-node-rename-input"]')) {
      return;
    }
    this.tabNav.handleTab(event);
  }

  protected onCloseKeydown(nodeId: string, event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      this.tabNav.handleTab(event);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.removeNode(nodeId, event);
    }
  }

  protected commitRename(nodeId: string): void {
    if (this.renamingNodeId() !== nodeId) {
      return;
    }
    this.state.updateNodeLabel(nodeId, this.renameDraft());
    this.renamingNodeId.set(null);
  }

  protected cancelRename(event: Event): void {
    event.stopPropagation();
    this.renamingNodeId.set(null);
  }

  protected stopHeaderEvent(event: Event): void {
    event.stopPropagation();
    if (event instanceof KeyboardEvent && event.key === ' ') {
      event.preventDefault();
    }
  }

  protected clearCanvasSelection(event: Event): void {
    if (this.dragState || this.resizeState) {
      return;
    }
    if (event instanceof KeyboardEvent && event.key === ' ') {
      event.preventDefault();
    }
    event.stopPropagation();
    this.state.clearSelection();
  }

  private isShellDragBlocked(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) {
      return true;
    }
    return !!target.closest(
      '.canvas__node-close, .canvas__node-name, .canvas__node-name-input, .canvas__port, .canvas__resize-handle, input, textarea, select, button, a, [contenteditable="true"]',
    );
  }

  protected onShellPointerDown(nodeId: string, event: PointerEvent): void {
    event.stopPropagation();

    if (this.isShellDragBlocked(event.target)) {
      return;
    }

    const additive = event.shiftKey;
    if (additive) {
      this.state.selectNode(nodeId, { additive: true });
      return;
    }

    if (!this.state.isNodeSelected(nodeId)) {
      this.state.selectNode(nodeId);
    }

    const node = this.state.nodes().find((item) => item.id === nodeId);
    event.preventDefault();
    if (!node?.layout) {
      return;
    }

    const nodeIds = this.state.selectedNodeIdsSet().has(nodeId)
      ? [...this.state.selectedNodeIds()]
      : [nodeId];

    const nodesById = this.state.nodesById();
    const origins = new Map<string, { x: number; y: number }>();
    for (const id of nodeIds) {
      const selectedNode = nodesById.get(id);
      if (selectedNode?.layout) {
        origins.set(id, { x: selectedNode.layout.x, y: selectedNode.layout.y });
      }
    }

    this.dragState = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      origins,
    };

    this.state.beginLayoutHistory();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  protected onShellPointerMove(event: PointerEvent): void {
    if (!this.dragState || this.dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - this.dragState.startClientX;
    const deltaY = event.clientY - this.dragState.startClientY;

    const updates = new Map<string, { x: number; y: number }>();
    for (const [id, origin] of this.dragState.origins) {
      updates.set(id, {
        x: snapToCanvasGrid(origin.x + deltaX),
        y: snapToCanvasGrid(origin.y + deltaY),
      });
    }
    this.state.updateNodesLayoutBatch(updates, { skipHistory: true });
    this.autoScrollSurface(event.clientY);
    this.syncViewport();
  }

  private autoScrollSurface(clientY: number): void {
    const surface = this.surfaceRef?.nativeElement;
    if (!surface) {
      return;
    }

    const rect = surface.getBoundingClientRect();
    const edge = 56;
    const speed = 16;

    if (clientY > rect.bottom - edge) {
      surface.scrollTop += speed;
    } else if (clientY < rect.top + edge) {
      surface.scrollTop = Math.max(0, surface.scrollTop - speed);
    }
  }

  protected onShellPointerUp(event: PointerEvent): void {
    if (!this.dragState || this.dragState.pointerId !== event.pointerId) {
      return;
    }
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    this.dragState = null;
    this.state.commitLayoutHistory();
  }

  protected onResizePointerDown(nodeId: string, event: PointerEvent): void {
    event.stopPropagation();
    event.preventDefault();

    if (!this.state.isNodeSelected(nodeId)) {
      this.state.selectNode(nodeId);
    }

    const node = this.state.nodes().find((item) => item.id === nodeId);
    if (!node?.layout) {
      return;
    }

    this.resizeState = {
      pointerId: event.pointerId,
      nodeId,
      originWidth: node.layout.width,
      originHeight: node.layout.height ?? estimateCanvasNodeHeight(node),
      startClientX: event.clientX,
      startClientY: event.clientY,
    };

    this.state.beginLayoutHistory();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  protected onResizePointerMove(event: PointerEvent): void {
    const resizeState = this.resizeState;
    if (!resizeState || resizeState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - resizeState.startClientX;
    const deltaY = event.clientY - resizeState.startClientY;
    const node = this.state.nodes().find((item) => item.id === resizeState.nodeId);
    const minHeight = node ? canvasNodeContentMinHeight(node) : CANVAS_MIN_NODE_HEIGHT;
    const rawHeight = resizeState.originHeight + deltaY;
    const nextHeight = clampCanvasNodeHeight(Math.max(minHeight, rawHeight));

    this.state.updateNodeLayout(resizeState.nodeId, {
      width: clampCanvasNodeWidth(resizeState.originWidth + deltaX),
      height: nextHeight,
    }, { skipHistory: true });
  }

  protected onResizePointerUp(event: PointerEvent): void {
    if (!this.resizeState || this.resizeState.pointerId !== event.pointerId) {
      return;
    }
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    this.resizeState = null;
    this.state.commitLayoutHistory();
  }

  @HostListener('document:pointerup', ['$event'])
  protected onDocumentPointerUp(event: PointerEvent): void {
    if (this.dragState?.pointerId === event.pointerId) {
      this.dragState = null;
      this.state.commitLayoutHistory();
    }
    if (this.resizeState?.pointerId === event.pointerId) {
      this.resizeState = null;
      this.state.commitLayoutHistory();
    }
  }

  protected onOutputPortClick(nodeId: string, portId: string, event: Event): void {
    event.stopPropagation();
    const additive = event instanceof MouseEvent && event.shiftKey;
    if (additive) {
      this.state.selectNode(nodeId, { additive: true });
      return;
    }
    this.state.beginBindingFrom(nodeId, portId);
  }

  protected onInputPortClick(nodeId: string, portId: string, event: Event): void {
    event.stopPropagation();
    if (this.state.pendingBindingSource()) {
      this.state.tryCompleteBindingTo(nodeId, portId);
      return;
    }
    const additive = event instanceof MouseEvent && event.shiftKey;
    this.state.selectNode(nodeId, { additive });
  }

  protected isPendingOutput(nodeId: string, portId: string): boolean {
    const pending = this.state.pendingBindingSource();
    return pending?.nodeId === nodeId && pending?.portId === portId;
  }

  protected isPendingTarget(nodeId: string, portId: string): boolean {
    if (!this.state.pendingBindingSource()) {
      return false;
    }
    return !this.isPendingOutput(nodeId, portId);
  }

  protected nodeHeaderHeight(node: ComponentNode): number {
    return canvasNodeHeaderHeight(node);
  }

  protected readonly dashboardBanner = computed(() => {
    const composite = this.state.composite();
    if (!composite?.templateId) {
      return null;
    }
    return {
      name: composite.name,
      description: composite.description,
      templateId: composite.templateId,
    };
  });

  protected nodeHeight(node: ComponentNode): number {
    return estimateCanvasNodeHeight(node);
  }

  protected nodePreviewMinHeight(node: ComponentNode): number {
    return canvasNodePreviewHeight(node);
  }

  protected portInputHint(nodeId: string, portId: string, portName: string, dataType: string): string {
    const sourceLabel = this.portInputSourceLabel(nodeId, portId);
    if (sourceLabel) {
      return `${portName} (${dataType}) — wired from ${sourceLabel}`;
    }
    return `${portName} (${dataType}) — click to connect an output port`;
  }

  protected portOutputHint(nodeId: string, portId: string, portName: string, dataType: string): string {
    const targets = this.portOutputTargetLabels(nodeId, portId);
    if (targets.length) {
      return `${portName} (${dataType}) — wired to ${targets.join(', ')}`;
    }
    return `${portName} (${dataType}) — click to start a binding`;
  }

  protected portInputSourceLabel(nodeId: string, portId: string): string | null {
    const binding = this.state
      .bindings()
      .find((entry) => entry.targetNodeId === nodeId && entry.targetPortId === portId);
    if (!binding) {
      return null;
    }
    return this.state.nodesById().get(binding.sourceNodeId)?.label ?? null;
  }

  protected portOutputTargetLabels(nodeId: string, portId: string): string[] {
    return this.state
      .bindings()
      .filter((entry) => entry.sourceNodeId === nodeId && entry.sourcePortId === portId)
      .map((entry) => this.state.nodesById().get(entry.targetNodeId)?.label)
      .filter((label): label is string => !!label);
  }

  private edgeForBinding(
    binding: Binding,
    nodesById: ReadonlyMap<string, ComponentNode>,
  ): BindingEdge | null {
    const source = this.portAnchor(binding.sourceNodeId, binding.sourcePortId, 'output', nodesById);
    const target = this.portAnchor(binding.targetNodeId, binding.targetPortId, 'input', nodesById);
    if (!source || !target) {
      return null;
    }
    return {
      id: binding.id,
      x1: source.x,
      y1: source.y,
      x2: target.x,
      y2: target.y,
    };
  }

  private portAnchor(
    nodeId: string,
    portId: string,
    direction: 'input' | 'output',
    nodesById: ReadonlyMap<string, ComponentNode>,
  ): { x: number; y: number } | null {
    const node = nodesById.get(nodeId);
    if (!node?.layout) {
      return null;
    }

    const ports = direction === 'input' ? node.ports.inputs : node.ports.outputs;
    const index = ports.findIndex((port) => port.id === portId);
    if (index < 0) {
      return null;
    }

    const x =
      direction === 'input'
        ? node.layout.x
        : node.layout.x + node.layout.width;
    const y = node.layout.y + this.nodeHeaderHeight(node) + index * PORT_ROW_HEIGHT + PORT_ROW_HEIGHT / 2;

    return { x, y };
  }
}
