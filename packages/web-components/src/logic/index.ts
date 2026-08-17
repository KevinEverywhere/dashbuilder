export * from './timer/index.js';

import { registerRdTimer } from './timer/index.js';

export function registerRosettaDashLogicElements(): void {
  registerRdTimer();
}
