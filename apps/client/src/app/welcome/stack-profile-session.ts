import type { Composite, StackProfile } from '@rosettadash/core';

export const BUILDER_SESSION_KEY = 'rosettadash:session';
export const PENDING_STACK_KEY = 'rosettadash:pending-stack';
export const PENDING_PROJECT_NAME_KEY = 'rosettadash:pending-project-name';
export const ACTIVE_STACK_KEY = 'rosettadash:active-stack';
export const LIBRARY_RESTORE_KEY = 'rosettadash:library-restore';

export interface BuilderSession {
  projectId: string;
  compositeId: string;
}

export interface LibraryRestorePayload {
  entryId: string;
  composite: Composite;
  stackProfile?: StackProfile | null;
}

export function readPendingStackProfile(): StackProfile | null {
  const raw = sessionStorage.getItem(PENDING_STACK_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StackProfile;
  } catch {
    return null;
  }
}

export function writePendingStackProfile(profile: StackProfile): void {
  sessionStorage.setItem(PENDING_STACK_KEY, JSON.stringify(profile));
}

export function clearPendingStackProfile(): void {
  sessionStorage.removeItem(PENDING_STACK_KEY);
}

export function readPendingProjectName(): string | null {
  const raw = sessionStorage.getItem(PENDING_PROJECT_NAME_KEY);
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function writePendingProjectName(name: string): void {
  sessionStorage.setItem(PENDING_PROJECT_NAME_KEY, name.trim());
}

export function clearPendingProjectName(): void {
  sessionStorage.removeItem(PENDING_PROJECT_NAME_KEY);
}

export function readBuilderSession(): BuilderSession | null {
  const raw = sessionStorage.getItem(BUILDER_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as BuilderSession;
  } catch {
    return null;
  }
}

export function hasBuilderSession(): boolean {
  return readBuilderSession() !== null;
}

export function clearBuilderSession(): void {
  sessionStorage.removeItem(BUILDER_SESSION_KEY);
}

export function readActiveStackProfile(): StackProfile | null {
  const raw = sessionStorage.getItem(ACTIVE_STACK_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StackProfile;
  } catch {
    return null;
  }
}

export function writeActiveStackProfile(profile: StackProfile): void {
  sessionStorage.setItem(ACTIVE_STACK_KEY, JSON.stringify(profile));
}

export function clearActiveStackProfile(): void {
  sessionStorage.removeItem(ACTIVE_STACK_KEY);
}

export function writeLibraryRestore(payload: LibraryRestorePayload): void {
  sessionStorage.setItem(LIBRARY_RESTORE_KEY, JSON.stringify(payload));
}

export function readLibraryRestore(): LibraryRestorePayload | null {
  const raw = sessionStorage.getItem(LIBRARY_RESTORE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as LibraryRestorePayload;
  } catch {
    return null;
  }
}

export function clearLibraryRestore(): void {
  sessionStorage.removeItem(LIBRARY_RESTORE_KEY);
}

export function canEnterBuilder(): boolean {
  return hasBuilderSession() || readPendingStackProfile() !== null;
}
