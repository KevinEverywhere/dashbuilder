import type { ProxyOptions } from 'vite';

/** Vite dev-server proxy: `/parity-api/*` → generated parity server `/api/*`. */
export function parityApiProxy(serverPort: number): Record<string, ProxyOptions> {
  return {
    '/parity-api': {
      target: `http://127.0.0.1:${serverPort}`,
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/parity-api/, '/api'),
    },
  };
}
