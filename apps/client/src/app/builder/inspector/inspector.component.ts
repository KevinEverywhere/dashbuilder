import { JsonPipe } from '@angular/common';
import { Component, computed, effect, HostBinding, inject, signal } from '@angular/core';
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
import { BuilderWorkspaceLayoutService } from '../builder-workspace-layout.service';
import { DomainContextPanelComponent } from './domain-context-panel.component';
import { VersionHistoryPanelComponent } from './version-history-panel.component';

@Component({
  selector: 'app-inspector',
  imports: [JsonPipe, FormsModule, DomainContextPanelComponent, VersionHistoryPanelComponent, AppSelectComponent],
  templateUrl: './inspector.component.html',
  styleUrl: './inspector.component.scss',
})
export class InspectorComponent {
  protected readonly state = inject(BuilderStateService);
  protected readonly layout = inject(BuilderWorkspaceLayoutService);

  @HostBinding('class.inspector--collapsed')
  protected get inspectorCollapsed(): boolean {
    return !this.layout.compact() && this.layout.inspectorCollapsed();
  }

  private readonly expandedSectionIds = signal<ReadonlySet<string>>(new Set());
  private selectionKey = '';

  protected readonly labelDraft = signal('');
  private readonly labelFieldFocused = signal(false);

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
    if (node.type === 'domain.role-gate') {
      return def.properties.filter((property) => property.key !== 'roles');
    }
    return def.properties;
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

  protected isSectionExpanded(sectionId: string): boolean {
    return this.expandedSectionIds().has(sectionId);
  }

  protected toggleSection(sectionId: string): void {
    this.expandedSectionIds.update((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
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
  }

  protected applySuggestion(suggestionId: string): void {
    this.state.applySuggestion(suggestionId);
  }

  protected dismissSuggestion(suggestionId: string): void {
    this.state.dismissSuggestion(suggestionId);
  }

  protected isRoleAllowed(roleId: string): boolean {
    return this.roleGateAllowedRoles().includes(roleId);
  }

  protected toggleRoleGateRole(roleId: string, enabled: boolean): void {
    this.state.toggleRoleGateRole(roleId, enabled);
  }

  private defaultExpandedSections(): ReadonlySet<string> {
    const next = new Set<string>(['overview']);
    const node = this.node();
    const def = this.definition();

    if (node) {
      if (node.layout) {
        next.add('placement');
      }
      if (this.editableProperties().length) {
        next.add('properties');
      }
      if (this.nodeSuggestions().length) {
        next.add('suggestions');
      }
      if (this.nodeBindings().length) {
        next.add('bindings');
      }
      if (node.type === 'domain.role-gate') {
        next.add('roles');
      }
      return next;
    }

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
}
