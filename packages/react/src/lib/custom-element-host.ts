import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type Ref,
  type RefCallback,
} from 'react';
import { mergeRef } from './merge-ref.js';

type AttrValue = string | number | boolean | undefined | null;

export interface CustomElementHostOptions {
  register: () => void;
  attrs?: Record<string, string>;
  /** Prop keys synced via `element.setProperty(name, value)` when available. */
  properties?: string[];
  events?: Record<string, string>;
}

function toKebab(name: string): string {
  return name.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
}

function syncAttributes(
  el: HTMLElement,
  values: Record<string, AttrValue>,
  attrMap: Record<string, string>,
): void {
  for (const [key, value] of Object.entries(values)) {
    const attr = attrMap[key] ?? toKebab(key);
    if (value === undefined || value === null || value === false) {
      if (el.hasAttribute(attr)) {
        el.removeAttribute(attr);
      }
      continue;
    }
    const next = value === true ? '' : String(value);
    if (el.getAttribute(attr) === next) {
      continue;
    }
    if (value === true) {
      el.setAttribute(attr, '');
    } else {
      el.setAttribute(attr, String(value));
    }
  }
}

/**
 * Thin React host around a registered custom element.
 * Attributes use setAttribute only (WC getters often have no setters).
 */
function syncProperties(
  el: HTMLElement,
  propertyValues: Record<string, unknown>,
  propertyKeys: string[],
): void {
  const setProperty = (el as { setProperty?: (name: string, value: unknown) => void })
    .setProperty;
  if (typeof setProperty !== 'function') {
    return;
  }
  for (const key of propertyKeys) {
    setProperty.call(el, key, propertyValues[key]);
  }
}

export function useCustomElementHost(
  options: CustomElementHostOptions,
  values: Record<string, AttrValue>,
  handlers: Record<string, ((detail: unknown) => void) | undefined> = {},
  forwardedRef?: Ref<HTMLElement | null>,
  propertyValues: Record<string, unknown> = {},
): RefCallback<HTMLElement | null> {
  const host = useRef<HTMLElement | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const eventMapRef = useRef(options.events ?? {});
  eventMapRef.current = options.events ?? {};
  const attrMap = options.attrs ?? {};
  const registerRef = useRef(options.register);
  registerRef.current = options.register;

  useEffect(() => {
    registerRef.current();
  }, []);

  const propertyKeys = options.properties ?? [];

  useLayoutEffect(() => {
    const el = host.current;
    if (!el) {
      return;
    }
    syncAttributes(el, values, attrMap);
    syncProperties(el, propertyValues, propertyKeys);
  });

  useEffect(() => {
    const el = host.current;
    if (!el) {
      return;
    }
    const listeners: Array<[string, EventListener]> = [];
    for (const [domEvent, handlerKey] of Object.entries(eventMapRef.current)) {
      const listener: EventListener = (event) => {
        const handler = handlersRef.current[handlerKey];
        handler?.((event as CustomEvent).detail);
      };
      el.addEventListener(domEvent, listener);
      listeners.push([domEvent, listener]);
    }
    return () => {
      for (const [domEvent, listener] of listeners) {
        el.removeEventListener(domEvent, listener);
      }
    };
  }, []);

  return useCallback(mergeRef(host, forwardedRef), [forwardedRef]);
}
