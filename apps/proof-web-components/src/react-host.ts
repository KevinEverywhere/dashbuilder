import { createElement, type ComponentType } from 'react';
import { createRoot, type Root } from 'react-dom/client';

let root: Root | null = null;
let host: HTMLElement | null = null;

export function mountReactComponent(
  container: HTMLElement,
  component: ComponentType<Record<string, unknown>>,
  props: Record<string, unknown>,
): void {
  if (host !== container) {
    root?.unmount();
    root = createRoot(container);
    host = container;
  }
  root.render(createElement(component, props));
}

export function unmountReactComponent(): void {
  root?.unmount();
  root = null;
  host = null;
}
