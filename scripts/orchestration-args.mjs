/**
 * Shared argv parsing for dev orchestration scripts.
 */

export function parseCompanionArgs(argv) {
  const project = argv[2];
  if (!project) {
    return { error: 'missing project' };
  }

  const targetIndex = argv.indexOf('--target');
  const target = targetIndex >= 0 ? argv[targetIndex + 1] : 'serve';
  if (!target) {
    return { error: 'missing --target value' };
  }

  if (target !== 'serve' && target !== 'storybook') {
    return { error: `invalid target: ${target}` };
  }

  return { project, target };
}

export function companionUsage(scriptName) {
  return `Usage: ${scriptName} <nx-project> [--target serve|storybook]`;
}
