export const ATLAS_USER_ROLES = [
  { id: 'viewer', label: 'Viewer' },
  { id: 'editor', label: 'Editor' },
  { id: 'admin', label: 'Admin' },
] as const;

export type AtlasUserRole = (typeof ATLAS_USER_ROLES)[number]['id'];

/** Screens restricted to specific roles (omit = all roles). */
export const SCREEN_ROLE_ACCESS: Partial<Record<string, AtlasUserRole[]>> = {
  plan: ['editor', 'admin'],
  authoring: ['editor', 'admin'],
  stack: ['admin'],
};

export function roleAllows(currentRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(currentRole);
}

export function screenAllowedForRole(screenId: string, role: AtlasUserRole): boolean {
  const allowed = SCREEN_ROLE_ACCESS[screenId];
  return !allowed || allowed.includes(role);
}

export function roleLabel(role: AtlasUserRole): string {
  return ATLAS_USER_ROLES.find((entry) => entry.id === role)?.label ?? role;
}
