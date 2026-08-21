import { JsonPipe } from '@angular/common';
import {
  Component,
  computed,
  effect,
  HostBinding,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Binding,
  DefaultSuggestion,
  NodeLayout,
  PropertySchema,
  defaultComponentRegistry,
  parseRoleGateAllowedRoles,
  resolveRoleOptions,
} from '@rosettadash/core';
import {
  AppSelectComponent,
  AppSelectOption,
} from '../../shared/app-select/app-select.component';
import { CANVAS_GRID_SIZE, CANVAS_MIN_NODE_HEIGHT, CANVAS_MIN_NODE_WIDTH } from '../canvas/canvas-layout';
import { BuilderStateService } from '../builder-state.service';
import {
  BuilderInspectorTabStop,
  BuilderTabNavigationService,
} from '../builder-tab-navigation.service';
import { BuilderWorkspaceLayoutService } from '../builder-workspace-layout.service';
import { DomainContextPanelComponent } from './domain-context-panel.component';
import { VersionHistoryPanelComponent } from './version-history-panel.component';

@Component({
  selector: 'app-inspector',
  imports: [JsonPipe, FormsModule, DomainContextPanelComponent, VersionHistoryPanelComponent, AppSelectComponent],
  templateUrl: './inspector.component.html',
  styleUrl: './inspector.component.scss',
})
export class InspectorComponent implements OnInit, OnDestroy {
  protected readonly state = inject(BuilderStateService);
  protected readonly layout = inject(BuilderWorkspaceLayoutService);
  private readonly tabNav = inject(BuilderTabNavigationService);

  @HostBinding('class.inspector--collapsed')
  protected get inspectorCollapsed(): boolean {
    return !this.layout.compact() && this.layout.inspectorCollapsed();
  }

  private readonly expandedSectionIds = signal<ReadonlySet<string>>(new Set());
  private selectionKey = '';

  protected readonly labelDraft = signal('');
  private readonly labelFieldFocused = signal(false);
  /** Suggestions panel opened via Enter/Space for dismiss actions. */
  protected readonly suggestionBrowseMode = signal(false);
  /** Bindings panel opened via Enter/Space for remove actions. */
  protected readonly bindingBrowseMode = signal(false);

  protected readonly definition = computed(() => {
    const selected = this.state.selectedDefinition();
    if (selected) {
      return selected;
    }
    const node = this.state.selectedNode();
    return node ? defaultComponentRegistry.get(node.type) ?? null : null;
  });

  protected readonly node = computed(() => this.state.selectedNode());
  protected readonly nodeBindings = computed(() => this.state.bindingsForSelectedNode());
  protected readonly nodeSuggestions = computed(() => {
    const node = this.state.selectedNode();
    if (!node) {
      return [] as DefaultSuggestion[];
    }
    return this.state.suggestionsForNode(node.id);
  });
  protected readonly hasSelection = computed(() => this.definition() !== null);
  protected readonly hasComposite = computed(() => this.state.composite() !== null);
  protected readonly isEditingNode = computed(() => this.node() !== null);
  protected readonly canEditPlacement = computed(
    () => this.node()?.layout !== undefined && this.state.selectedNodeIds().length === 1,
  );
  protected readonly nodeLayout = computed(() => this.node()?.layout ?? null);
  protected readonly canvasGridSize = CANVAS_GRID_SIZE;
  protected readonly canvasMinNodeWidth = CANVAS_MIN_NODE_WIDTH;
  protected readonly canvasMinNodeHeight = CANVAS_MIN_NODE_HEIGHT;
  protected readonly isRoleGateNode = computed(() => this.node()?.type === 'domain.role-gate');
  protected readonly roleGateOptions = computed(() =>
    resolveRoleOptions(this.state.domainContext()?.roles),
  );
  protected readonly roleGateAllowedRoles = computed(() => {
    const node = this.node();
    if (!node) {
      return [] as string[];
    }
    return parseRoleGateAllowedRoles(node.properties['roles']);
  });

  protected readonly editableProperties = computed(() => {
    const def = this.definition();
    const node = this.node();
    if (!def || !node) {
      return [] as PropertySchema[];
    }
    const base =
      node.type === 'domain.role-gate'
        ? def.properties.filter((property) => property.key !== 'roles')
        : def.properties;
    return base.filter((property) => {
      if (property.key !== 'rows') {
        return true;
      }
      const rows = node.properties['rows'];
      return typeof rows === 'number' && rows > 1;
    });
  });

  protected readonly hasOptionsBinding = computed(() => {
    const node = this.node();
    if (!node) {
      return false;
    }
    return this.state
      .bindings()
      .some((binding) => binding.targetNodeId === node.id && binding.targetPortId === 'options');
  });

  protected isPropertyDimmed(prop: PropertySchema): boolean {
    return prop.key === 'staticOptions' && this.hasOptionsBinding();
  }

  /** Primary form controls on one row. */
  protected readonly primaryPropertyKeys = ['label', 'id', 'required', 'border'] as const;

  protected readonly primaryProperties = computed(() => {
    const byKey = new Map(this.editableProperties().map((prop) => [prop.key, prop]));
    return this.primaryPropertyKeys
      .map((key) => byKey.get(key))
      .filter((prop): prop is PropertySchema => prop !== undefined);
  });

  protected readonly placeholderProperty = computed(() =>
    this.editableProperties().find((prop) => prop.key === 'placeholder') ?? null,
  );

  /** Remaining properties in a compact 2-column grid. */
  protected readonly secondaryProperties = computed(() => {
    const reserved = new Set<string>([...this.primaryPropertyKeys, 'placeholder']);
    return this.editableProperties().filter((prop) => !reserved.has(prop.key));
  });

  constructor() {
    effect(() => {
      const key =
        this.node()?.id ??
        this.state.selectedDefinition()?.type ??
        '';
      if (key === this.selectionKey) {
        return;
      }
      this.selectionKey = key;
      this.suggestionBrowseMode.set(false);
      this.bindingBrowseMode.set(false);
      this.expandedSectionIds.set(this.defaultExpandedSections());
    });

    // Mirror the instance label into the draft field whenever it's not being actively edited
    // here — keeps this in sync with renames made via canvas double-click without fighting
    // in-progress typing in this field.
    effect(() => {
      const label = this.node()?.label ?? '';
      if (!this.labelFieldFocused()) {
        this.labelDraft.set(label);
      }
    });
  }

  ngOnInit(): void {
    this.tabNav.setInspectorIntegration({
      stops: () => this.inspectorTabStops(),
      expandSection: (sectionId) => this.expandOnly(sectionId),
    });
  }

  ngOnDestroy(): void {
    this.tabNav.setInspectorIntegration(null);
  }

  protected isSectionExpanded(sectionId: string): boolean {
    return this.expandedSectionIds().has(sectionId);
  }

  protected toggleSection(sectionId: string): void {
    if (sectionId === 'suggestions') {
      if (this.isSectionExpanded('suggestions') && this.suggestionBrowseMode()) {
        this.closeSuggestionBrowse();
        return;
      }
      this.openSuggestionsBrowse();
      return;
    }

    if (sectionId === 'bindings') {
      if (this.isSectionExpanded('bindings') && this.bindingBrowseMode()) {
        this.closeBindingBrowse();
        return;
      }
      this.openBindingsBrowse();
      return;
    }

    this.expandedSectionIds.update((current) => {
      if (current.has(sectionId) && current.size === 1) {
        return new Set();
      }
      return new Set([sectionId]);
    });
    this.suggestionBrowseMode.set(false);
    this.bindingBrowseMode.set(false);
  }

  protected expandOnly(sectionId: string | null): void {
    this.suggestionBrowseMode.set(false);
    this.bindingBrowseMode.set(false);
    if (!sectionId) {
      this.expandedSectionIds.set(new Set());
      return;
    }
    this.expandedSectionIds.set(new Set([sectionId]));
  }

  protected addToCanvas(): void {
    const definition = this.state.selectedDefinition();
    if (definition) {
      this.state.addNodeFromDefinition(definition);
    }
  }

  protected removeNode(): void {
    this.state.removeSelectedNode();
  }

  protected updateProperty(schema: PropertySchema, value: string | number | boolean): void {
    if (schema.readOnly || this.isPropertyDimmed(schema)) {
      return;
    }
    const node = this.node();
    if (!node) {
      return;
    }
    this.state.updateNodeProperty(node.id, schema.key, value);
  }

  protected onLabelFocus(): void {
    this.labelFieldFocused.set(true);
  }

  protected onLabelInput(value: string): void {
    this.labelDraft.set(value);
  }

  protected commitNodeLabel(nodeId: string): void {
    this.state.updateNodeLabel(nodeId, this.labelDraft());
    this.labelFieldFocused.set(false);
  }

  protected cancelNodeLabelEdit(event: Event): void {
    this.labelFieldFocused.set(false);
    this.labelDraft.set(this.node()?.label ?? '');
    if (event.target instanceof HTMLInputElement) {
      event.target.blur();
    }
  }

  protected updateLayoutField(field: keyof NodeLayout, value: number | string | null): void {
    const node = this.node();
    if (!node?.layout) {
      return;
    }
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }
    this.state.updateNodeLayout(node.id, { [field]: parsed });
  }

  protected selectOptions(schema: PropertySchema): readonly AppSelectOption[] {
    return (schema.options ?? []).map((option) => ({
      label: option.label,
      value: String(option.value),
    }));
  }

  protected readSelectProperty(key: string): string {
    const value = this.readProperty(key);
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }

  protected updateSelectProperty(schema: PropertySchema, value: string): void {
    const match = schema.options?.find((option) => String(option.value) === value);
    this.updateProperty(schema, match?.value ?? value);
  }

  protected readProperty(key: string): unknown {
    const node = this.node();
    return node?.properties[key];
  }

  protected describeBinding(binding: Binding): string {
    const source = this.state.nodes().find((node) => node.id === binding.sourceNodeId);
    const target = this.state.nodes().find((node) => node.id === binding.targetNodeId);
    if (!source || !target) {
      return 'Unknown binding';
    }
    const sourcePort = defaultComponentRegistry.findPort(
      source,
      binding.sourcePortId,
      'output',
    );
    const targetPort = defaultComponentRegistry.findPort(
      target,
      binding.targetPortId,
      'input',
    );
    return `${source.label}.${sourcePort?.name ?? binding.sourcePortId} → ${target.label}.${targetPort?.name ?? binding.targetPortId}`;
  }

  protected removeBinding(bindingId: string): void {
    this.state.removeBinding(bindingId);
    this.returnFocusToComponent();
  }

  protected applySuggestion(suggestionId: string): void {
    this.state.applySuggestion(suggestionId);
    this.returnFocusToComponent();
  }

  protected dismissSuggestion(suggestionId: string): void {
    this.state.dismissSuggestion(suggestionId);
    this.returnFocusToComponent();
  }

  protected openSuggestionsBrowse(): void {
    this.bindingBrowseMode.set(false);
    this.suggestionBrowseMode.set(true);
    this.expandedSectionIds.set(new Set(['suggestions']));
    setTimeout(() => {
      const firstAction = document.querySelector<HTMLElement>(
        '[data-testid="inspector-suggestions"] [data-suggestion-action]',
      );
      firstAction?.focus();
    });
  }

  protected closeSuggestionBrowse(): void {
    this.suggestionBrowseMode.set(false);
    this.expandedSectionIds.set(new Set());
    setTimeout(() => {
      document
        .querySelector<HTMLElement>('[data-builder-tab="suggestions"]')
        ?.focus();
    });
  }

  protected openBindingsBrowse(): void {
    this.suggestionBrowseMode.set(false);
    this.bindingBrowseMode.set(true);
    this.expandedSectionIds.set(new Set(['bindings']));
    setTimeout(() => {
      const firstAction = document.querySelector<HTMLElement>(
        '[data-testid="inspector-bindings"] [data-binding-action]',
      );
      firstAction?.focus();
    });
  }

  protected closeBindingBrowse(): void {
    this.bindingBrowseMode.set(false);
    this.expandedSectionIds.set(new Set());
    setTimeout(() => {
      document
        .querySelector<HTMLElement>('[data-builder-tab="bindings"]')
        ?.focus();
    });
  }

  private returnFocusToComponent(): void {
    this.suggestionBrowseMode.set(false);
    this.bindingBrowseMode.set(false);
    this.expandedSectionIds.set(new Set());
    this.tabNav.focusNodeTitle();
  }

  protected onSuggestionsHeaderKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.openSuggestionsBrowse();
    }
  }

  protected onBindingsHeaderKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.openBindingsBrowse();
    }
  }

  protected isRoleAllowed(roleId: string): boolean {
    return this.roleGateAllowedRoles().includes(roleId);
  }

  protected toggleRoleGateRole(roleId: string, enabled: boolean): void {
    this.state.toggleRoleGateRole(roleId, enabled);
  }

  private inspectorTabStops(): BuilderInspectorTabStop[] {
    if (!this.node()) {
      return [];
    }

    const stops: BuilderInspectorTabStop[] = [
      { key: 'inspector-name', sectionId: 'overview' },
    ];

    if (this.canEditPlacement()) {
      stops.push(
        { key: 'layout-x', sectionId: 'placement' },
        { key: 'layout-y', sectionId: 'placement' },
        { key: 'layout-width', sectionId: 'placement' },
        { key: 'layout-height', sectionId: 'placement' },
      );
    }

    if (this.nodeSuggestions().length > 0) {
      stops.push({ key: 'suggestions', sectionId: 'suggestions', headerOnly: true });
    }

    if (this.nodeBindings().length > 0) {
      stops.push({ key: 'bindings', sectionId: 'bindings', headerOnly: true });
    }

    if (this.isRoleGateNode()) {
      for (const role of this.roleGateOptions()) {
        stops.push({ key: `role-${role.id}`, sectionId: 'roles' });
      }
    }

    for (const prop of this.primaryProperties()) {
      stops.push({ key: `prop-${prop.key}`, sectionId: 'properties' });
    }
    if (this.placeholderProperty()) {
      stops.push({ key: 'prop-placeholder', sectionId: 'properties' });
    }
    for (const prop of this.secondaryProperties()) {
      stops.push({ key: `prop-${prop.key}`, sectionId: 'properties' });
    }

    stops.push({ key: 'inspector-remove', sectionId: null });
    return stops;
  }

  private defaultExpandedSections(): ReadonlySet<string> {
    // Node editing: accordion — start collapsed; tab focus opens one section.
    if (this.node()) {
      return new Set();
    }

    const next = new Set<string>(['overview']);
    const def = this.definition();
    if (def) {
      if (def.properties.length) {
        next.add('schema-properties');
      }
      if (def.inputs.length || def.outputs.length) {
        next.add('ports');
      }
    }
    return next;
  }

  protected onHeaderClick(): void {
    if (!this.layout.compact()) {
      this.layout.toggleInspectorCollapsed();
    }
  }

  protected showInspectorBody(): boolean {
    return this.layout.compact() || !this.layout.inspectorCollapsed();
  }

  @HostListener('keydown', ['$event'])
  protected onInspectorKeydown(event: KeyboardEvent): void {
    if (!this.isEditingNode()) {
      return;
    }

    if (event.key === 'Escape' && this.suggestionBrowseMode()) {
      event.preventDefault();
      event.stopPropagation();
      this.closeSuggestionBrowse();
      return;
    }

    if (event.key === 'Escape' && this.bindingBrowseMode()) {
      event.preventDefault();
      event.stopPropagation();
      this.closeBindingBrowse();
      return;
    }

    if (event.key === 'Tab' && this.suggestionBrowseMode()) {
      if (this.handleSuggestionActionTab(event)) {
        return;
      }
    }

    if (event.key === 'Tab' && this.bindingBrowseMode()) {
      if (this.handleBindingActionTab(event)) {
        return;
      }
    }

    if (event.key === 'Tab') {
      this.tabNav.handleTab(event);
    }
  }

  /** Local Tab cycle among suggestion Apply/Dismiss controls. */
  private handleSuggestionActionTab(event: KeyboardEvent): boolean {
    return this.handleLocalActionTab(
      event,
      '[data-testid="inspector-suggestions"]',
      '[data-suggestion-action]',
      () => this.closeSuggestionBrowse(),
    );
  }

  /** Local Tab cycle among binding Remove controls. */
  private handleBindingActionTab(event: KeyboardEvent): boolean {
    return this.handleLocalActionTab(
      event,
      '[data-testid="inspector-bindings"]',
      '[data-binding-action]',
      () => this.closeBindingBrowse(),
    );
  }

  private handleLocalActionTab(
    event: KeyboardEvent,
    rootSelector: string,
    actionSelector: string,
    onExit: () => void,
  ): boolean {
    const root = document.querySelector(rootSelector);
    if (!root) {
      return false;
    }
    const actions = Array.from(root.querySelectorAll<HTMLElement>(actionSelector));
    if (actions.length === 0) {
      return false;
    }

    const active = document.activeElement;
    const index = actions.findIndex((el) => el === active || el.contains(active));
    if (index < 0) {
      return false;
    }

    event.preventDefault();
    event.stopPropagation();
    const direction = event.shiftKey ? -1 : 1;
    if (!event.shiftKey && index === actions.length - 1) {
      onExit();
      return true;
    }
    if (event.shiftKey && index === 0) {
      onExit();
      return true;
    }
    const next = actions[(index + direction + actions.length) % actions.length];
    next?.focus();
    return true;
  }
}
