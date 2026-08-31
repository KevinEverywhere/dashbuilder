import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  resolvePreviewContent,
  type PreviewContentDocument,
  type PreviewContentSlice,
} from '@rosettadash/ui-primitives';

let cached: { path: string; mtimeMs: number; document: PreviewContentDocument; slice: PreviewContentSlice } | null = null;

export function resolvePreviewContentPath(workspaceRoot = process.cwd()): string {
  return join(workspaceRoot, 'packages/ui-primitives/preview-content.json');
}

export function loadPreviewContent(workspaceRoot = process.cwd()): {
  document: PreviewContentDocument;
  slice: PreviewContentSlice;
} {
  const path = resolvePreviewContentPath(workspaceRoot);
  if (!existsSync(path)) {
    return resolvePreviewContent(null);
  }

  const mtimeMs = statSync(path).mtimeMs;
  if (cached && cached.path === path && cached.mtimeMs === mtimeMs) {
    return { document: cached.document, slice: cached.slice };
  }

  const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  const resolved = resolvePreviewContent(raw);
  cached = { path, mtimeMs, ...resolved };
  return resolved;
}

/** @deprecated Use loadPreviewContent */
export function loadPreviewSampleData(workspaceRoot = process.cwd()): PreviewContentSlice {
  return loadPreviewContent(workspaceRoot).slice;
}
