const textCache = new Map<string, Promise<string>>();

/** Load co-located `.html` / `.css` for shadow roots (browser fetch). */
export function loadTextResource(relativePath: string, baseUrl: string): Promise<string> {
  const url = new URL(relativePath, baseUrl);
  const cacheKey = url.href;
  const cached = textCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const promise = (async () => {
    const fetchUrl = new URL(relativePath, baseUrl);
    // Vite dev serves `.css` as HMR modules unless `?raw` is requested.
    if (relativePath.endsWith('.css')) {
      fetchUrl.searchParams.set('raw', '');
    }

    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch(fetchUrl);
        if (!response.ok) {
          throw new Error(`Failed to load ${fetchUrl.href}: ${response.status}`);
        }
        return response.text();
      } catch (error) {
        lastError = error;
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`Failed to load ${fetchUrl.href}`);
  })().catch((error) => {
    textCache.delete(cacheKey);
    throw error;
  });

  textCache.set(cacheKey, promise);
  return promise;
}

export interface ShadowMountOptions {
  html: string;
  css: string;
}

/** Apply stylesheet + markup to an open shadow root. */
export function applyShadowMount(root: ShadowRoot, options: ShadowMountOptions): void {
  root.innerHTML = '';
  const style = document.createElement('style');
  style.textContent = options.css;
  root.appendChild(style);

  const template = document.createElement('template');
  template.innerHTML = options.html;
  root.appendChild(template.content.cloneNode(true));
}

/** Load paired `.html` + `.css` next to the calling module. */
export async function loadShadowPair(
  baseUrl: string,
  htmlFile: string,
  cssFile: string,
): Promise<ShadowMountOptions> {
  const [html, css] = await Promise.all([
    loadTextResource(htmlFile, baseUrl),
    loadTextResource(cssFile, baseUrl),
  ]);
  return { html, css };
}
