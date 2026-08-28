/** Vite build-time env exposed to consumer secret resolution. */
export function getViteBuildEnv(): Record<string, string | undefined> {
  const env = import.meta.env as Record<string, string | undefined>;
  return {
    VITE_GOOGLE_MAPS_API_KEY: env.VITE_GOOGLE_MAPS_API_KEY,
    VITE_MAPTILER_API_KEY: env.VITE_MAPTILER_API_KEY,
    VITE_NEWS_API_KEY: env.VITE_NEWS_API_KEY,
    GOOGLE_MAPS_API_KEY: env.VITE_GOOGLE_MAPS_API_KEY,
    MAPTILER_API_KEY: env.VITE_MAPTILER_API_KEY,
    NEWS_API_KEY: env.VITE_NEWS_API_KEY,
  };
}
