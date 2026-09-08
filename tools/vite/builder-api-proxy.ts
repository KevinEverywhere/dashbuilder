import type { ProxyOptions } from 'vite';

/** Vite dev-server proxy: `/builder-api/*` → RosettaDash builder `/api/*`. */
export function builderApiProxy(port = 3000): Record<string, ProxyOptions> {
  return {
    '/builder-api': {
      target: `http://127.0.0.1:${port}`,
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/builder-api/, '/api'),
    },
  };
}
