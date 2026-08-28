let pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
let search = typeof window !== 'undefined' ? window.location.search : '';
const listeners = new Set<() => void>();

function syncFromWindow(): void {
  pathname = window.location.pathname;
  search = window.location.search;
  for (const listener of listeners) {
    listener();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', syncFromWindow);
}

export function subscribeRouter(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRouterPath(): string {
  return pathname;
}

export function getRouterSearch(): string {
  return search;
}

export function getRouterFullPath(): string {
  return pathname + search;
}

export function routerPush(path: string, query?: Record<string, string>, replace = false): void {
  const searchStr = query && Object.keys(query).length ? `?${new URLSearchParams(query).toString()}` : '';
  const url = path + searchStr;
  if (replace) {
    history.replaceState(null, '', url);
  } else {
    history.pushState(null, '', url);
  }
  syncFromWindow();
}

export function routerReplace(path: string, query?: Record<string, string>): void {
  routerPush(path, query, true);
}
