export * from './i18n/index.js';
export * from './time-preset/index.js';
export * from './role-gate/index.js';
export * from './person-invite/index.js';
export * from './role-assign/index.js';

import { registerRosettaDashDomainElements as registerI18n } from './i18n/index.js';
import { registerRdTimePreset } from './time-preset/index.js';
import { registerRdRoleGate } from './role-gate/index.js';
import { registerRdPersonInvite } from './person-invite/index.js';
import { registerRdRoleAssign } from './role-assign/index.js';

export function registerRosettaDashDomainElements(): void {
  registerI18n();
  registerRdTimePreset();
  registerRdRoleGate();
  registerRdPersonInvite();
  registerRdRoleAssign();
}
