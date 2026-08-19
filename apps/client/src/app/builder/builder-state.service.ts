import { Injectable, computed, signal } from '@angular/core';
import {
  Binding,
  ComponentDefinition,
  ComponentNode,
  Composite,
  DefaultSuggestion,
  DomainContext,
  NodeLayout,
  Project,
  RoleDefinition,
  TimeRangePreset,
  areDataTypesCompatible,
  buildCompositeTemplate,
  computeCompanionLayout,
  defaultComponentRegistry,
  evaluateDefaults,
  getGroupingGuide,
  listMissingCompanionTypes,
  listCompositeTemplates,
  normalizeDomainContext,
  slugifyDomainId,
  suggestionsForSelectedNode,
  resolvePresentationDimensions,
  shouldSyncLayoutOnPropertyChange,
  syncMediaDisplayPropertiesFromLayout,
  CUSTOM_VIDEO_DISPLAY_SIZE,
  readCustomDisplayDimensions,
  type AiBuilderAction,
  type PlacementPrompt,
} from '@rosettadash/core';
import {
  CANVAS_GRID_SIZE,
  clampCanvasNodeHeight,
  clampCanvasNodeWidth,
  snapToCanvasGrid,
} from './canvas/canvas-layout';
import {
  BuilderHistoryStack,
  type BuilderGraphSnapshot,
} from './history/builder-history';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export type WorkspaceMode = 'design' | 'preview';

export interface PendingBindingSource {
  nodeId: string;
  portId: string;
}

export type CreateBindingResult =
  | { ok: true; binding: Binding }
  | { ok: false; error: string };

export type ApplyAiActionsResult = { ok: true } | { ok: false; error: string };

@Injectable({ providedIn: 'root' })
export class BuilderStateService {
  readonly project = signal<Project | null>(null);
  readonly composite = signal<Composite | null>(null);
  readonly nodes = signal<ComponentNode[]>([]);
  readonly bindings = signal<Binding[]>([]);
  readonly selectedDefinition = signal<ComponentDefinition | null>(null);
  readonly selectedNodeIds = signal<string[]>([]);
  readonly pendingBindingSource = signal<PendingBindingSource | null>(null);
  readonly bindingMessage = signal<string | null>(null);
  readonly workspaceMode = signal<WorkspaceMode>('design');
  readonly dirty = signal(false);
  readonly saveStatus = signal<SaveStatus>('idle');
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly suggestions = signal<DefaultSuggestion[]>([]);
  readonly dismissedSuggestionIds = signal<Set<string>>(new Set());
  readonly previewRoleId = signal('viewer');
  readonly placementPrompt = signal<PlacementPrompt | null>(null);

  private readonly history = new BuilderHistoryStack();
  private historySuspended = false;
  private layoutTransactionActive = false;

  readonly canUndo = signal(false);
  readonly canRedo = signal(false);

  readonly selectedNodeId = computed(() => this.selectedNodeIds()[0] ?? null);

  readonly selectedNode = computed(() => {
    const id = this.selectedNodeId();
    if (!id) {
      return null;
    }
    return this.nodes().find((node) => node.id === id) ?? null;
  });

  readonly selectedNodes = computed(() => {
    const ids = new Set(this.selectedNodeIds());
    return this.nodes().filter((node) => ids.has(node.id));
  });

  readonly selectedNodeIdsSet = computed(() => new Set(this.selectedNodeIds()));

  readonly boundInputPortKeys = computed(
    () =>
      new Set(
        this.bindings().map((binding) => `${binding.targetNodeId}:${binding.targetPortId}`),
      ),
  );

  readonly nodesById = computed(() => {
    const map = new Map<string, ComponentNode>();
    for (const node of this.nodes()) {
      map.set(node.id, node);
    }
    return map;
  });

  readonly bindingsForSelectedNode = computed(() => {
    const nodeId = this.selectedNodeId();
    if (!nodeId) {
      return [];
    }
    return this.bindings().filter(
      (binding) => binding.sourceNodeId === nodeId || binding.targetNodeId === nodeId,
    );
  });

  readonly domainContext = computed(() => this.composite()?.domainContext);

  readonly previewRoleOptions = computed(() => {
    const roles = this.domainContext()?.roles;
    if (roles?.length) {
      return roles;
    }
    return [
      { id: 'viewer', name: 'Viewer' },
      { id: 'editor', name: 'Editor' },
      { id: 'admin', name: 'Admin' },
      { id: 'owner', name: 'Owner' },
    ] satisfies RoleDefinition[];
  });

  selectDefinition(definition: ComponentDefinition): void {
    this.selectedDefinition.set(definition);
    this.selectedNodeIds.set([]);
    this.clearPendingBinding();
  }

  selectNode(nodeId: string, options?: { additive?: boolean }): void {
    const additive = options?.additive ?? false;
    if (additive) {
      this.selectedNodeIds.update((ids) =>
        ids.includes(nodeId) ? ids.filter((id) => id !== nodeId) : [...ids, nodeId],
      );
    } else {
      this.selectedNodeIds.set([nodeId]);
    }
    this.selectedDefinition.set(null);
    this.refreshSuggestionsForSelection();
  }

  isNodeSelected(nodeId: string): boolean {
    return this.selectedNodeIdsSet().has(nodeId);
  }

  clearSelection(): void {
    this.selectedDefinition.set(null);
    this.selectedNodeIds.set([]);
    this.clearPendingBinding();
  }

  updateNodeLayout(nodeId: string, layout: Partial<NodeLayout>, options?: { skipHistory?: boolean }): void {
    this.updateNodesLayoutBatch(new Map([[nodeId, layout]]), options);
  }

  updateNodesLayoutBatch(
    updates: ReadonlyMap<string, Partial<NodeLayout>>,
    options?: { skipHistory?: boolean },
  ): void {
    if (updates.size === 0) {
      return;
    }
    if (!options?.skipHistory && !this.layoutTransactionActive) {
      this.recordHistory();
    }
    this.nodes.update((nodes) =>
      nodes.map((node) => {
        const patch = updates.get(node.id);
        if (!patch) {
          return node;
        }
        const current = node.layout ?? { x: 24, y: 24, width: 220, height: 72 };
        const next: NodeLayout = { ...current, ...patch };
        if (patch.x !== undefined) {
          next.x = snapToCanvasGrid(patch.x);
        }
        if (patch.y !== undefined) {
          next.y = snapToCanvasGrid(patch.y);
        }
        if (patch.width !== undefined) {
          next.width = clampCanvasNodeWidth(patch.width);
        }
        if (patch.height !== undefined) {
          next.height = clampCanvasNodeHeight(patch.height);
        }
        const properties = syncMediaDisplayPropertiesFromLayout(
          node.type,
          next,
          node.properties,
          current,
        );
        return { ...node, layout: next, properties };
      }),
    );
    this.markDirty();
  }

  beginLayoutHistory(): void {
    if (this.layoutTransactionActive) {
      return;
    }
    this.layoutTransactionActive = true;
    this.history.beginTransaction(this.captureHistorySnapshot());
  }

  commitLayoutHistory(): void {
    if (!this.layoutTransactionActive) {
      return;
    }
    this.layoutTransactionActive = false;
    this.history.commitTransaction();
    this.syncHistoryAvailability();
  }

  cancelLayoutHistory(): void {
    if (!this.layoutTransactionActive) {
      return;
    }
    this.layoutTransactionActive = false;
    this.history.cancelTransaction();
  }

  moveSelectedNodes(deltaX: number, deltaY: number): void {
    const selected = new Set(this.selectedNodeIds());
    if (selected.size === 0) {
      return;
    }
    this.nodes.update((nodes) =>
      nodes.map((node) => {
        if (!selected.has(node.id) || !node.layout) {
          return node;
        }
        return {
          ...node,
          layout: {
            ...node.layout,
            x: snapToCanvasGrid(node.layout.x + deltaX),
            y: snapToCanvasGrid(node.layout.y + deltaY),
          },
        };
      }),
    );
    this.markDirty();
  }

  addNodeFromDefinition(
    definition: ComponentDefinition,
    options?: { layout?: Partial<NodeLayout>; skipPlacementPrompt?: boolean },
  ): ComponentNode {
    if (!this.historySuspended) {
      this.recordHistory();
    }
    const node = defaultComponentRegistry.createNode(definition.type, {
      layout: this.resolveInitialLayout(definition.type, {
        x: snapToCanvasGrid(options?.layout?.x ?? 24),
        y: snapToCanvasGrid(
          options?.layout?.y ?? this.nodes().length * CANVAS_GRID_SIZE * 6 + 24,
        ),
        width: options?.layout?.width,
        height: options?.layout?.height,
      }),
    });
    this.nodes.update((nodes) => [...nodes, node]);
    this.selectedNodeIds.set([node.id]);
    this.selectedDefinition.set(null);
    this.mergeSuggestions(
      evaluateDefaults(this.defaultsContext(), { type: 'nodeAdded', nodeId: node.id }, defaultComponentRegistry, {
        dismissedIds: this.dismissedSuggestionIds(),
      }),
    );
    if (!options?.skipPlacementPrompt) {
      this.refreshPlacementPrompt(node.id);
    }
    this.markDirty();
    return node;
  }

  addCompanionFromPrompt(companionType: string): ComponentNode | null {
    const prompt = this.placementPrompt();
    if (!prompt) {
      return null;
    }

    const source = this.nodes().find((node) => node.id === prompt.sourceNodeId);
    const definition = defaultComponentRegistry.get(companionType);
    if (!source?.layout || !definition) {
      return null;
    }

    const layout = computeCompanionLayout(source.layout, prompt.sourceType, companionType, {
      gridSize: CANVAS_GRID_SIZE,
      defaultWidth: clampCanvasNodeWidth(220),
      defaultHeight: clampCanvasNodeHeight(72),
    });

    const node = this.addNodeFromDefinition(definition, {
      layout,
      skipPlacementPrompt: true,
    });
    this.refreshPlacementPrompt(prompt.sourceNodeId);
    return node;
  }

  dismissPlacementPrompt(): void {
    this.placementPrompt.set(null);
  }

  updateNodeProperty(nodeId: string, key: string, value: unknown): void {
    const current = this.nodes().find((node) => node.id === nodeId);
    if (current?.properties[key] === value) {
      return;
    }
    if (!this.historySuspended) {
      this.recordHistory();
    }
    this.nodes.update((nodes) =>
      nodes.map((node) =>
        node.id === nodeId
          ? { ...node, properties: { ...node.properties, [key]: value } }
          : node,
      ),
    );
    if (current && key === 'displaySize' && value === CUSTOM_VIDEO_DISPLAY_SIZE) {
      this.seedCustomDisplayFromLayout(nodeId);
    } else if (current && shouldSyncLayoutOnPropertyChange(current.type, key)) {
      const updated = {
        ...current,
        properties: { ...current.properties, [key]: value },
      };
      this.syncPresentationLayout(updated);
    }
    this.markDirty();
  }

  private seedCustomDisplayFromLayout(nodeId: string): void {
    const node = this.nodes().find((item) => item.id === nodeId);
    if (!node?.layout) {
      return;
    }
    this.nodes.update((nodes) =>
      nodes.map((item) =>
        item.id === nodeId
          ? {
              ...item,
              properties: {
                ...item.properties,
                displaySize: CUSTOM_VIDEO_DISPLAY_SIZE,
                customWidth: node.layout!.width,
                customHeight: node.layout!.height,
              },
            }
          : item,
      ),
    );
  }

  private resolveInitialLayout(
    type: string,
    partial: { x: number; y: number; width?: number; height?: number },
  ): NodeLayout {
    const defaults = defaultComponentRegistry.createNode(type);
    const presentation = resolvePresentationDimensions(defaults);
    return {
      x: partial.x,
      y: partial.y,
      width: clampCanvasNodeWidth(partial.width ?? presentation?.width ?? 220),
      height: clampCanvasNodeHeight(partial.height ?? presentation?.height ?? 72),
    };
  }

  private syncPresentationLayout(node: ComponentNode): void {
    const presentation = resolvePresentationDimensions(node);
    if (!presentation) {
      return;
    }
    this.updateNodeLayout(
      node.id,
      {
        width: presentation.width,
        height: presentation.height,
      },
      { skipHistory: true },
    );
  }

  removeNode(nodeId: string): void {
    this.removeNodes([nodeId]);
  }

  removeSelectedNode(): void {
    this.removeNodes(this.selectedNodeIds());
  }

  removeNodes(nodeIds: string[]): void {
    const ids = new Set(nodeIds);
    if (ids.size === 0) {
      return;
    }
    this.recordHistory();
    this.nodes.update((nodes) => nodes.filter((node) => !ids.has(node.id)));
    this.bindings.update((bindings) =>
      bindings.filter(
        (binding) => !ids.has(binding.sourceNodeId) && !ids.has(binding.targetNodeId),
      ),
    );
    this.selectedNodeIds.update((selected) => selected.filter((id) => !ids.has(id)));
    this.clearPendingBinding();
    this.markDirty();
  }

  setProjectContext(project: Project, composite: Composite): void {
    this.project.set(project);
    this.composite.set(composite);
    this.nodes.set([...composite.nodes]);
    this.bindings.set([...(composite.bindings ?? [])]);
    this.dirty.set(false);
    this.saveStatus.set('idle');
    this.errorMessage.set(null);
    this.clearPendingBinding();
    this.resetHistory();
  }

  applySavedComposite(composite: Composite): void {
    this.composite.set(composite);
    this.nodes.set([...composite.nodes]);
    this.bindings.set([...(composite.bindings ?? [])]);
    this.dirty.set(false);
    this.saveStatus.set('saved');
    this.clearPendingBinding();
    this.resetHistory();
  }

  applyOnboardingTemplate(): void {
    this.applyCompositeTemplate('onboarding');
  }

  applyCompositeTemplate(templateId: string, options?: { skipConfirm?: boolean }): void {
    const composite = this.composite();
    if (!composite) {
      return;
    }

    if (
      !options?.skipConfirm &&
      this.dirty() &&
      typeof globalThis.confirm === 'function' &&
      !globalThis.confirm(
        'Replace the current canvas with this template? Unsaved changes will be lost.',
      )
    ) {
      return;
    }

    const template = buildCompositeTemplate(templateId, defaultComponentRegistry, {
      id: composite.id,
      version: composite.version,
    });

    this.composite.set({
      ...composite,
      name: template.name,
      description: template.description,
      templateId: template.templateId,
      nodes: template.nodes,
      bindings: template.bindings,
      exportTargets: template.exportTargets,
      domainContext: template.domainContext,
    });
    this.nodes.set([...template.nodes]);
    this.bindings.set([...(template.bindings ?? [])]);
    this.selectedNodeIds.set([]);
    this.selectedDefinition.set(null);
    this.clearPendingBinding();
    this.resetHistory();
    this.markDirty();
  }

  undo(): void {
    if (!this.history.canUndo) {
      return;
    }
    const snapshot = this.history.undo(this.captureHistorySnapshot());
    if (snapshot) {
      this.applyHistorySnapshot(snapshot);
      this.syncHistoryAvailability();
    }
  }

  redo(): void {
    if (!this.history.canRedo) {
      return;
    }
    const snapshot = this.history.redo(this.captureHistorySnapshot());
    if (snapshot) {
      this.applyHistorySnapshot(snapshot);
      this.syncHistoryAvailability();
    }
  }

  buildCompositePayload(): Composite {
    const composite = this.composite();
    if (!composite) {
      throw new Error('No composite loaded');
    }
    return {
      ...composite,
      nodes: this.nodes(),
      bindings: this.bindings(),
    };
  }

  beginBindingFrom(nodeId: string, portId: string): void {
    const pending = this.pendingBindingSource();
    if (pending?.nodeId === nodeId && pending?.portId === portId) {
      this.clearPendingBinding();
      return;
    }
    this.pendingBindingSource.set({ nodeId, portId });
    this.bindingMessage.set(null);
  }

  tryCompleteBindingTo(targetNodeId: string, targetPortId: string): void {
    const pending = this.pendingBindingSource();
    if (!pending) {
      return;
    }

    const before = this.captureHistorySnapshot();
    const result = this.createBinding(
      pending.nodeId,
      pending.portId,
      targetNodeId,
      targetPortId,
    );
    this.pendingBindingSource.set(null);

    if (result.ok) {
      this.history.record(before);
      this.syncHistoryAvailability();
      this.bindingMessage.set(null);
      this.mergeSuggestions(
        evaluateDefaults(
          this.defaultsContext(),
          { type: 'bindingCreated', bindingId: result.binding.id },
          defaultComponentRegistry,
          { dismissedIds: this.dismissedSuggestionIds() },
        ),
      );
      this.markDirty();
      return;
    }

    this.bindingMessage.set(result.error);
  }

  createBinding(
    sourceNodeId: string,
    sourcePortId: string,
    targetNodeId: string,
    targetPortId: string,
  ): CreateBindingResult {
    if (sourceNodeId === targetNodeId) {
      return { ok: false, error: 'Cannot bind a node to itself' };
    }

    const sourceNode = this.nodes().find((node) => node.id === sourceNodeId);
    const targetNode = this.nodes().find((node) => node.id === targetNodeId);
    if (!sourceNode || !targetNode) {
      return { ok: false, error: 'Binding nodes not found on canvas' };
    }

    const sourcePort = defaultComponentRegistry.findPort(
      sourceNode,
      sourcePortId,
      'output',
    );
    const targetPort = defaultComponentRegistry.findPort(
      targetNode,
      targetPortId,
      'input',
    );

    if (!sourcePort) {
      return { ok: false, error: 'Source output port not found' };
    }
    if (!targetPort) {
      return { ok: false, error: 'Target input port not found' };
    }

    if (!areDataTypesCompatible(sourcePort.dataType, targetPort.dataType)) {
      return {
        ok: false,
        error: `Incompatible types: ${sourcePort.dataType} → ${targetPort.dataType}`,
      };
    }

    const duplicate = this.bindings().some(
      (binding) =>
        binding.sourceNodeId === sourceNodeId &&
        binding.sourcePortId === sourcePortId &&
        binding.targetNodeId === targetNodeId &&
        binding.targetPortId === targetPortId,
    );
    if (duplicate) {
      return { ok: false, error: 'This binding already exists' };
    }

    const binding: Binding = {
      id: crypto.randomUUID(),
      sourceNodeId,
      sourcePortId,
      targetNodeId,
      targetPortId,
    };

    this.bindings.update((bindings) => [
      ...bindings.filter(
        (existing) =>
          !(
            existing.targetNodeId === targetNodeId &&
            existing.targetPortId === targetPortId
          ),
      ),
      binding,
    ]);

    return { ok: true, binding };
  }

  removeBinding(bindingId: string): void {
    this.recordHistory();
    this.bindings.update((bindings) =>
      bindings.filter((binding) => binding.id !== bindingId),
    );
    this.markDirty();
  }

  clearPendingBinding(): void {
    this.pendingBindingSource.set(null);
    this.bindingMessage.set(null);
  }

  setWorkspaceMode(mode: WorkspaceMode): void {
    this.workspaceMode.set(mode);
    if (mode === 'preview') {
      this.clearPendingBinding();
    }
  }

  setPreviewRoleId(roleId: string): void {
    this.previewRoleId.set(roleId);
  }

  previewNodes = computed(() =>
    this.nodes().filter((node) => {
      const definition = defaultComponentRegistry.get(node.type);
      return definition?.isVisual ?? false;
    }),
  );

  isInputBound(nodeId: string, portId: string): boolean {
    return this.boundInputPortKeys().has(`${nodeId}:${portId}`);
  }

  markDirty(): void {
    this.dirty.set(true);
    this.saveStatus.set('idle');
  }

  patchDomainContext(patch: {
    clientName?: string;
    clientId?: string;
    projectName?: string;
    projectId?: string;
    defaultTimeRange?: TimeRangePreset | '';
  }): void {
    this.recordHistory();
    const composite = this.composite();
    if (!composite) {
      return;
    }

    const current: DomainContext = { ...(composite.domainContext ?? {}) };

    if (patch.clientName !== undefined) {
      if (patch.clientName.trim()) {
        current.client = {
          id:
            patch.clientId?.trim() ||
            current.client?.id?.trim() ||
            slugifyDomainId(patch.clientName) ||
            'client',
          name: patch.clientName.trim(),
        };
      } else {
        delete current.client;
      }
    } else if (patch.clientId !== undefined && current.client) {
      current.client = {
        ...current.client,
        id: patch.clientId.trim() || slugifyDomainId(current.client.name) || 'client',
      };
    }

    if (patch.projectName !== undefined) {
      if (patch.projectName.trim()) {
        current.project = {
          id:
            patch.projectId?.trim() ||
            current.project?.id?.trim() ||
            slugifyDomainId(patch.projectName) ||
            'project',
          name: patch.projectName.trim(),
        };
      } else {
        delete current.project;
      }
    } else if (patch.projectId !== undefined && current.project) {
      current.project = {
        ...current.project,
        id: patch.projectId.trim() || slugifyDomainId(current.project.name) || 'project',
      };
    }

    if (patch.defaultTimeRange !== undefined) {
      if (patch.defaultTimeRange) {
        current.defaultTimeRange = patch.defaultTimeRange;
      } else {
        delete current.defaultTimeRange;
      }
    }

    const normalized = normalizeDomainContext(current);
    this.composite.set({ ...composite, domainContext: normalized });
    this.markDirty();
  }

  addDomainRole(role: RoleDefinition): void {
    const composite = this.composite();
    if (!composite) {
      return;
    }

    const current = composite.domainContext ?? {};
    const roles = [...(current.roles ?? [])];
    if (roles.some((entry) => entry.id === role.id)) {
      return;
    }

    this.recordHistory();
    roles.push(role);
    const normalized = normalizeDomainContext({ ...current, roles });
    this.composite.set({ ...composite, domainContext: normalized });
    this.markDirty();
  }

  removeDomainRole(roleId: string): void {
    const composite = this.composite();
    if (!composite?.domainContext?.roles?.length) {
      return;
    }

    this.recordHistory();
    const current = composite.domainContext;
    const roles = current.roles?.filter((role) => role.id !== roleId) ?? [];
    const normalized = normalizeDomainContext({ ...current, roles });
    this.composite.set({ ...composite, domainContext: normalized });
    this.markDirty();
  }

  toggleRoleGateRole(roleId: string, enabled: boolean): void {
    const node = this.selectedNode();
    if (!node || node.type !== 'domain.role-gate') {
      return;
    }

    const current = Array.isArray(node.properties['roles'])
      ? node.properties['roles'].filter((entry): entry is string => typeof entry === 'string')
      : [];
    const next = enabled
      ? current.includes(roleId)
        ? current
        : [...current, roleId]
      : current.filter((entry) => entry !== roleId);

    this.updateNodeProperty(node.id, 'roles', next);
  }

  suggestionsForNode(nodeId: string): DefaultSuggestion[] {
    return this.suggestions().filter((suggestion) => suggestion.nodeId === nodeId);
  }

  applyAiActions(actions: AiBuilderAction[]): ApplyAiActionsResult {
    if (!actions.length) {
      return { ok: false, error: 'No actions to apply.' };
    }

    const refMap = new Map<string, string>();
    const resolveNodeId = (nodeId?: string, nodeRef?: string): string | null => {
      if (nodeId) {
        return nodeId;
      }
      if (nodeRef) {
        return refMap.get(nodeRef) ?? null;
      }
      return null;
    };

    this.recordHistory();
    this.historySuspended = true;

    try {
      for (const action of actions) {
        if (action.op === 'add_node') {
          const definition = defaultComponentRegistry.get(action.type);
          if (!definition) {
            return { ok: false, error: `Unknown component type: ${action.type}` };
          }
          const node = this.addNodeFromDefinition(definition, {
            layout: action.layout,
            skipPlacementPrompt: true,
          });
          if (action.properties) {
            for (const [key, value] of Object.entries(action.properties)) {
              this.updateNodeProperty(node.id, key, value);
            }
          }
          if (action.ref) {
            refMap.set(action.ref, node.id);
          }
          continue;
        }

        if (action.op === 'set_property') {
          const nodeId = resolveNodeId(action.nodeId, action.nodeRef);
          if (!nodeId) {
            return { ok: false, error: 'Could not resolve node for set_property.' };
          }
          this.updateNodeProperty(nodeId, action.key, action.value);
          continue;
        }

        if (action.op === 'bind') {
          const sourceNodeId = resolveNodeId(action.sourceNodeId, action.sourceRef);
          const targetNodeId = resolveNodeId(action.targetNodeId, action.targetRef);
          if (!sourceNodeId || !targetNodeId) {
            return { ok: false, error: 'Could not resolve nodes for bind.' };
          }
          const result = this.createBinding(
            sourceNodeId,
            action.sourcePort,
            targetNodeId,
            action.targetPort,
          );
          if (!result.ok) {
            return result;
          }
          continue;
        }

        if (action.op === 'apply_template') {
          this.applyCompositeTemplate(action.templateId, { skipConfirm: true });
        }
      }
    } finally {
      this.historySuspended = false;
    }

    this.markDirty();
    return { ok: true };
  }

  applySuggestion(suggestionId: string): void {
    const suggestion = this.suggestions().find((entry) => entry.id === suggestionId);
    if (!suggestion?.patches?.length) {
      return;
    }

    this.recordHistory();
    this.historySuspended = true;
    try {
      for (const patch of suggestion.patches) {
        this.updateNodeProperty(suggestion.nodeId, patch.key, patch.value);
      }
    } finally {
      this.historySuspended = false;
    }

    this.nodes.update((nodes) =>
      nodes.map((node) =>
        node.id === suggestion.nodeId
          ? { ...node, meta: { ...node.meta, suggestedBy: 'defaults-engine' } }
          : node,
      ),
    );

    this.dismissSuggestion(suggestionId);
  }

  dismissSuggestion(suggestionId: string): void {
    this.dismissedSuggestionIds.update((ids) => new Set([...ids, suggestionId]));
    this.suggestions.update((entries) => entries.filter((entry) => entry.id !== suggestionId));
  }

  private defaultsContext() {
    return {
      nodes: this.nodes(),
      bindings: this.bindings(),
    };
  }

  private mergeSuggestions(incoming: DefaultSuggestion[]): void {
    if (incoming.length === 0) {
      return;
    }

    this.suggestions.update((current) => {
      const merged = new Map(current.map((entry) => [entry.id, entry]));
      for (const suggestion of incoming) {
        merged.set(suggestion.id, suggestion);
      }
      return [...merged.values()];
    });
  }

  private refreshSuggestionsForSelection(): void {
    const nodeId = this.selectedNodeId();
    if (!nodeId) {
      return;
    }

    this.mergeSuggestions(
      suggestionsForSelectedNode(this.defaultsContext(), nodeId, defaultComponentRegistry, {
        dismissedIds: this.dismissedSuggestionIds(),
      }),
    );
  }

  private captureHistorySnapshot(): BuilderGraphSnapshot {
    const composite = this.composite();
    return {
      nodes: structuredClone(this.nodes()),
      bindings: structuredClone(this.bindings()),
      composite: composite ? structuredClone(composite) : null,
      selectedNodeIds: [...this.selectedNodeIds()],
    };
  }

  private applyHistorySnapshot(snapshot: BuilderGraphSnapshot): void {
    this.historySuspended = true;
    try {
      this.nodes.set(structuredClone(snapshot.nodes));
      this.bindings.set(structuredClone(snapshot.bindings));
      if (snapshot.composite) {
        this.composite.set(structuredClone(snapshot.composite));
      }
      this.selectedNodeIds.set([...snapshot.selectedNodeIds]);
      this.selectedDefinition.set(null);
      this.clearPendingBinding();
      this.placementPrompt.set(null);
      this.refreshSuggestionsForSelection();
      this.markDirty();
    } finally {
      this.historySuspended = false;
    }
  }

  private recordHistory(): void {
    if (this.historySuspended) {
      return;
    }
    this.history.record(this.captureHistorySnapshot());
    this.syncHistoryAvailability();
  }

  private resetHistory(): void {
    this.history.clear();
    this.layoutTransactionActive = false;
    this.syncHistoryAvailability();
  }

  private syncHistoryAvailability(): void {
    this.canUndo.set(this.history.canUndo);
    this.canRedo.set(this.history.canRedo);
  }

  private refreshPlacementPrompt(sourceNodeId: string): void {
    const source = this.nodes().find((node) => node.id === sourceNodeId);
    if (!source) {
      this.placementPrompt.set(null);
      return;
    }

    const guide = getGroupingGuide(source.type);
    if (!guide) {
      this.placementPrompt.set(null);
      return;
    }

    const canvasTypes = this.nodes().map((node) => node.type);
    const missingTypes = listMissingCompanionTypes(source.type, canvasTypes);
    if (missingTypes.length === 0) {
      this.placementPrompt.set(null);
      return;
    }

    const companions = missingTypes
      .map((type) => {
        const definition = defaultComponentRegistry.get(type);
        if (!definition) {
          return null;
        }
        return { type, label: definition.label };
      })
      .filter(Boolean) as PlacementPrompt['companions'];

    if (companions.length === 0) {
      this.placementPrompt.set(null);
      return;
    }

    this.placementPrompt.set({
      sourceNodeId,
      sourceType: source.type,
      message: guide.placementMessage,
      animationKey: guide.animationKey,
      companions,
    });
  }
}
