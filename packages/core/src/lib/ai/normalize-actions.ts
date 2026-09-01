import type { AiBuilderAction } from './types';

function copyStringField(
  action: Record<string, unknown>,
  targetKey: string,
  sourceKeys: string[],
): void {
  if (readPresentString(action[targetKey])) {
    return;
  }
  for (const key of sourceKeys) {
    const value = action[key];
    if (readPresentString(value)) {
      action[targetKey] = value;
      return;
    }
  }
}

function readPresentString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Coerce common model field aliases before validation. */
export function normalizeAiBuilderActions(raw: unknown[]): AiBuilderAction[] {
  return raw.map((entry) => normalizeAiBuilderAction(entry)).filter(Boolean) as AiBuilderAction[];
}

export function normalizeAiBuilderAction(raw: unknown): AiBuilderAction | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const action = { ...(raw as Record<string, unknown>) };
  const op = action['op'];
  if (typeof op !== 'string') {
    return null;
  }

  if (op === 'bind') {
    copyStringField(action, 'sourcePort', ['sourcePortId', 'sourcePortName', 'outputPort']);
    copyStringField(action, 'targetPort', ['targetPortId', 'targetPortName', 'inputPort']);
    copyStringField(action, 'sourceNodeId', ['sourceNode', 'fromNodeId']);
    copyStringField(action, 'targetNodeId', ['targetNode', 'toNodeId']);
    copyStringField(action, 'sourceRef', ['sourceNodeRef', 'fromRef']);
    copyStringField(action, 'targetRef', ['targetNodeRef', 'toRef']);
  }

  if (op === 'set_property') {
    copyStringField(action, 'key', ['property', 'propertyKey']);
    copyStringField(action, 'nodeId', ['node', 'targetNodeId']);
    copyStringField(action, 'nodeRef', ['nodeReference', 'ref']);
  }

  if (op === 'add_node') {
    copyStringField(action, 'type', ['componentType', 'component']);
    copyStringField(action, 'ref', ['nodeRef', 'id']);
  }

  if (op === 'apply_template') {
    copyStringField(action, 'templateId', ['template', 'id']);
  }

  return action as AiBuilderAction;
}
