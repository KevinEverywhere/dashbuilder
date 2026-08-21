import { Injectable, inject } from '@angular/core';
import { BuilderStateService } from './builder-state.service';
import { BuilderWorkspaceLayoutService } from './builder-workspace-layout.service';

export interface BuilderInspectorTabStop {
  /** Matches `data-builder-tab` on the focus target. */
  key: string;
  /** Inspector section to expand exclusively; `null` keeps all collapsed (e.g. footer). */
  sectionId: string | null;
  /** Focus the control without expanding its panel (Suggestions header). */
  headerOnly?: boolean;
}

interface InspectorTabIntegration {
  stops: () => BuilderInspectorTabStop[];
  expandSection: (sectionId: string | null) => void;
}

interface CycleEntry {
  key: string;
  source: 'node' | 'inspector';
  sectionId: string | null;
  headerOnly: boolean;
}

@Injectable({ providedIn: 'root' })
export class BuilderTabNavigationService {
  private readonly state = inject(BuilderStateService);
  private readonly layout = inject(BuilderWorkspaceLayoutService);
  private renameStarter: ((nodeId: string) => void) | null = null;
  private inspector: InspectorTabIntegration | null = null;

  setRenameStarter(handler: ((nodeId: string) => void) | null): void {
    this.renameStarter = handler;
  }

  setInspectorIntegration(integration: InspectorTabIntegration | null): void {
    this.inspector = integration;
  }

  /** Move focus to the selected node title (rename when available). */
  focusNodeTitle(nodeId?: string): void {
    const id = nodeId ?? this.state.selectedNodeId();
    if (!id) {
      return;
    }
    this.inspector?.expandSection(null);
    this.renameStarter?.(id);
  }

  /**
   * Cycles focus through the selected canvas node’s builder fields, then the
   * inspector fields (accordion: one section open), then back to the node.
   * @returns true when Tab was handled
   */
  handleTab(
    event: KeyboardEvent,
    options?: {
      fromKey?: string;
      beforeMove?: () => void;
    },
  ): boolean {
    if (event.key !== 'Tab') {
      return false;
    }

    const nodeId = this.state.selectedNodeId();
    if (!nodeId || this.state.selectedNodeIds().length !== 1) {
      return false;
    }

    const nodeEl = this.nodeElement(nodeId);
    const inspectorEl = document.querySelector<HTMLElement>('[data-testid="inspector"]');
    if (!nodeEl || !inspectorEl) {
      return false;
    }

    const active = document.activeElement;
    const activeEl = active instanceof HTMLElement ? active : null;
    const inCycle =
      Boolean(options?.fromKey) ||
      Boolean(options?.beforeMove) ||
      (activeEl !== null && (nodeEl.contains(activeEl) || inspectorEl.contains(activeEl)));
    if (!inCycle) {
      return false;
    }

    // Suggestion/binding action buttons use a local cycle until Escape / dismiss.
    if (
      activeEl?.closest('[data-suggestion-action]') ||
      activeEl?.closest('[data-binding-action]')
    ) {
      return false;
    }

    event.preventDefault();
    event.stopPropagation();

    const direction: 1 | -1 = event.shiftKey ? -1 : 1;
    const fromKey = options?.fromKey;
    const needsInspectorExpand = !this.layout.compact() && this.layout.inspectorCollapsed();
    if (needsInspectorExpand) {
      this.layout.toggleInspectorCollapsed();
    }
    options?.beforeMove?.();

    const activate = (): void => {
      const cycle = this.buildCycle(nodeEl);
      if (cycle.length === 0) {
        return;
      }
      this.moveAlongCycle(cycle, direction, nodeId, nodeEl, inspectorEl, fromKey);
    };

    if (options?.beforeMove || needsInspectorExpand) {
      setTimeout(activate);
    } else {
      activate();
    }
    return true;
  }

  private buildCycle(nodeEl: HTMLElement): CycleEntry[] {
    const nodeEntries: CycleEntry[] = this.nodeTabTargets(nodeEl).map((el) => ({
      key: el.getAttribute('data-builder-tab') ?? '',
      source: 'node' as const,
      sectionId: null,
      headerOnly: false,
    })).filter((entry) => entry.key.length > 0);

    const inspectorEntries: CycleEntry[] = (this.inspector?.stops() ?? []).map((stop) => ({
      key: stop.key,
      source: 'inspector' as const,
      sectionId: stop.sectionId,
      headerOnly: Boolean(stop.headerOnly),
    }));

    return [...nodeEntries, ...inspectorEntries];
  }

  private nodeElement(nodeId: string): HTMLElement | null {
    const nodes = document.querySelectorAll<HTMLElement>('[data-testid="canvas-node"][data-node-id]');
    for (const node of nodes) {
      if (node.getAttribute('data-node-id') === nodeId) {
        return node;
      }
    }
    return null;
  }

  /** Name and body fields first, close control last within the node. */
  private nodeTabTargets(nodeEl: HTMLElement): HTMLElement[] {
    const all = this.visibleTabTargets(nodeEl);
    const close = all.filter((el) => el.getAttribute('data-builder-tab') === 'close');
    const rest = all.filter((el) => el.getAttribute('data-builder-tab') !== 'close');
    return [...rest, ...close];
  }

  private visibleTabTargets(root: HTMLElement): HTMLElement[] {
    return Array.from(
      root.querySelectorAll<HTMLElement>(
        '[data-builder-tab]:not([disabled]):not([aria-hidden="true"])',
      ),
    ).filter((el) => {
      if (el.closest('[hidden]')) {
        return false;
      }
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }

  private moveAlongCycle(
    cycle: CycleEntry[],
    direction: 1 | -1,
    nodeId: string,
    nodeEl: HTMLElement,
    inspectorEl: HTMLElement,
    fromKey?: string,
  ): void {
    let index = -1;
    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      const activeKey = active.closest<HTMLElement>('[data-builder-tab]')?.getAttribute('data-builder-tab');
      if (activeKey) {
        index = cycle.findIndex((entry) => entry.key === activeKey);
      }
    }
    if (index < 0 && fromKey) {
      index = cycle.findIndex((entry) => entry.key === fromKey);
    }
    if (index < 0) {
      index = direction > 0 ? -1 : 0;
    }

    const nextIndex = (index + direction + cycle.length) % cycle.length;
    this.activateCycleEntry(cycle[nextIndex]!, nodeId, nodeEl, inspectorEl);
  }

  private activateCycleEntry(
    entry: CycleEntry,
    nodeId: string,
    nodeEl: HTMLElement,
    inspectorEl: HTMLElement,
  ): void {
    if (entry.source === 'node') {
      this.inspector?.expandSection(null);
      const target = nodeEl.querySelector<HTMLElement>(`[data-builder-tab="${entry.key}"]`);
      if (!target) {
        return;
      }
      this.focusDomTarget(target, nodeId);
      return;
    }

    if (entry.headerOnly) {
      this.inspector?.expandSection(null);
    } else {
      this.inspector?.expandSection(entry.sectionId);
    }

    setTimeout(() => {
      const target = inspectorEl.querySelector<HTMLElement>(`[data-builder-tab="${entry.key}"]`);
      if (!target) {
        return;
      }
      this.focusDomTarget(target, nodeId);
    });
  }

  private focusDomTarget(target: HTMLElement, nodeId: string): void {
    if (target.matches('[data-testid="canvas-node-name"]')) {
      this.renameStarter?.(nodeId);
      return;
    }

    // Title rename input already focused when present.
    if (target.matches('[data-testid="canvas-node-rename-input"]')) {
      target.focus();
      if (target instanceof HTMLInputElement) {
        queueMicrotask(() => target.select());
      }
      return;
    }

    const focusable =
      target.matches('input, textarea, select, button, [tabindex]')
        ? target
        : target.querySelector<HTMLElement>('button, input, textarea, select, [tabindex]');
    const el = focusable ?? target;
    el.focus();
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      queueMicrotask(() => el.select());
    }
  }
}
