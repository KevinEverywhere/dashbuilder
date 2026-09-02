export type AttrValue = string | number | boolean | undefined | null;

export function setHostAttribute(
  host: HTMLElement,
  name: string,
  value: AttrValue,
): void {
  if (value === undefined || value === null || value === false) {
    if (host.hasAttribute(name)) {
      host.removeAttribute(name);
    }
    return;
  }
  const next = value === true ? '' : String(value);
  if (host.getAttribute(name) === next) {
    return;
  }
  if (value === true) {
    host.setAttribute(name, '');
  } else {
    host.setAttribute(name, String(value));
  }
}

export function setHostProperty(
  host: HTMLElement,
  name: string,
  value: unknown,
): void {
  const setProperty = (host as { setProperty?: (prop: string, val: unknown) => void })
    .setProperty;
  if (typeof setProperty === 'function') {
    setProperty.call(host, name, value);
  }
}

export function attachHostEvents(
  host: HTMLElement,
  handlers: Record<string, ((detail: unknown) => void) | undefined>,
): () => void {
  const listeners: Array<[string, EventListener]> = [];
  for (const [domEvent, handler] of Object.entries(handlers)) {
    if (!handler) {
      continue;
    }
    const listener: EventListener = (event) => {
      handler((event as CustomEvent).detail);
    };
    host.addEventListener(domEvent, listener);
    listeners.push([domEvent, listener]);
  }
  return () => {
    for (const [domEvent, listener] of listeners) {
      host.removeEventListener(domEvent, listener);
    }
  };
}
