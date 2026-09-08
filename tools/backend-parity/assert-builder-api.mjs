/**
 * Fail fast when PARITY_BUILDER_API / :3000 is not the RosettaDash builder.
 *
 * Another dev container (e.g. plantcast-web-dev) can also expose /api/health
 * without the export routes parity:generate needs.
 */

const BUILDER_APP_NAME = 'RosettaDash';

export async function assertBuilderApi(apiBase) {
  const base = apiBase.replace(/\/$/, '');
  const healthUrl = `${base}/health`;

  let response;
  try {
    response = await fetch(healthUrl);
  } catch (error) {
    throw new Error(
      `Could not reach the builder API at ${healthUrl}.\n` +
        `Start it with: npm run start:server (or npm run proof:react:live / npm run storybook:react:live)\n\n` +
        `Underlying error: ${error.message}`,
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  const body = await response.text();

  if (!contentType.includes('application/json')) {
    throw wrongServiceError(apiBase, healthUrl, body);
  }

  let health;
  try {
    health = JSON.parse(body);
  } catch {
    throw wrongServiceError(apiBase, healthUrl, body);
  }

  if (health.app !== BUILDER_APP_NAME) {
    throw wrongServiceError(apiBase, healthUrl, body, health);
  }

  return health;
}

function wrongServiceError(apiBase, healthUrl, body, health) {
  const preview = body.trim().slice(0, 120).replace(/\s+/g, ' ');
  const looksLikeHtml = /<!DOCTYPE|<html/i.test(body);
  const occupant =
    health?.app ??
    (looksLikeHtml ? 'a Next.js (or other) web app' : 'an unknown service');

  return new Error(
    `${healthUrl} is not the RosettaDash builder (expected app: "${BUILDER_APP_NAME}", ` +
      `got: ${JSON.stringify(occupant)}).\n\n` +
      `Port ${portFromApiBase(apiBase)} is in use by something else — ` +
      `${apiBase}/export/* will not work.\n\n` +
      `Fix:\n` +
      `  1. Stop the other process on that port (e.g. docker stop plantcast-web-dev)\n` +
      `  2. npm run parity:generate:live\n\n` +
      `Or point parity at a builder you started elsewhere:\n` +
      `  PARITY_BUILDER_API=http://127.0.0.1:<port>/api npm run parity:generate\n\n` +
      (preview ? `Response preview: ${preview}` : ''),
  );
}

function portFromApiBase(apiBase) {
  try {
    return new URL(apiBase).port || '3000';
  } catch {
    return '3000';
  }
}
