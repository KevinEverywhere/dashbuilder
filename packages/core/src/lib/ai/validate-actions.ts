import type { ComponentRegistry } from '../registry/component-registry';
import { areDataTypesCompatible } from '../model/data-types';
import { listCompositeTemplates } from '../templates/composite-template-registry';
import { readAiStringField } from './read-string-field';
import type { AiBuilderAction, AiActionValidationResult, AiNodeSummary } from './types';

function resolveNodeId(
  action: { nodeId?: string; nodeRef?: string } | { sourceNodeId?: string; sourceRef?: string },
  side: 'node' | 'source' | 'target',
  nodeIds: Set<string>,
  pendingRefs: Set<string>,
): string | null {
  if (side === 'node') {
    const typed = action as { nodeId?: string; nodeRef?: string };
    if (typed.nodeId) {
      return typed.nodeId;
    }
    if (typed.nodeRef) {
      return pendingRefs.has(typed.nodeRef) || nodeIds.has(typed.nodeRef) ? typed.nodeRef : null;
    }
    return null;
  }

  const bind = action as {
    sourceNodeId?: string;
    sourceRef?: string;
    targetNodeId?: string;
    targetRef?: string;
  };

  if (side === 'source') {
    if (bind.sourceNodeId) {
      return bind.sourceNodeId;
    }
    if (bind.sourceRef) {
      return pendingRefs.has(bind.sourceRef) || nodeIds.has(bind.sourceRef) ? bind.sourceRef : null;
    }
    return null;
  }

  if (bind.targetNodeId) {
    return bind.targetNodeId;
  }
  if (bind.targetRef) {
    return pendingRefs.has(bind.targetRef) || nodeIds.has(bind.targetRef) ? bind.targetRef : null;
  }
  return null;
}

export function validateAiBuilderActions(
  actions: AiBuilderAction[],
  registry: ComponentRegistry,
  nodes: AiNodeSummary[],
): AiActionValidationResult {
  const issues: AiActionValidationResult['issues'] = [];
  const applicableActions: AiBuilderAction[] = [];
  const explainActions: Array<{ op: 'explain'; markdown: string }> = [];
  const nodeIds = new Set(nodes.map((node) => node.id));
  const pendingRefs = new Set<string>();
  const templateIds = new Set(listCompositeTemplates().map((template) => template.id));

  actions.forEach((action, index) => {
    if (action.op === 'explain') {
      const markdown = readAiStringField(action.markdown);
      if (markdown) {
        explainActions.push({ op: 'explain', markdown });
      } else {
        issues.push({ index, message: 'Explain actions require markdown text.' });
      }
      return;
    }

    if (action.op === 'add_node') {
      const type = readAiStringField(action.type);
      if (!type) {
        issues.push({ index, message: 'add_node requires a component type.' });
        return;
      }
      if (!registry.get(type)) {
        issues.push({ index, message: `Unknown component type: ${type}` });
        return;
      }
      if (action.ref) {
        const ref = readAiStringField(action.ref);
        if (!ref) {
          issues.push({ index, message: 'add_node ref must be a text identifier.' });
          return;
        }
        if (pendingRefs.has(ref) || nodeIds.has(ref)) {
          issues.push({ index, message: `Duplicate node ref: ${ref}` });
          return;
        }
        pendingRefs.add(ref);
      }
      applicableActions.push({ ...action, type });
      return;
    }

    if (action.op === 'apply_template') {
      const templateId = readAiStringField(action.templateId);
      if (!templateId || !templateIds.has(templateId)) {
        issues.push({
          index,
          message: templateId
            ? `Unknown template id: ${templateId}`
            : 'apply_template requires a template id.',
        });
        return;
      }
      applicableActions.push({ ...action, templateId });
      return;
    }

    if (action.op === 'set_property') {
      const target = resolveNodeId(action, 'node', nodeIds, pendingRefs);
      if (!target) {
        issues.push({ index, message: 'set_property requires nodeId or nodeRef.' });
        return;
      }
      const key = readAiStringField(action.key);
      if (!key) {
        issues.push({ index, message: 'set_property requires a property key.' });
        return;
      }
      applicableActions.push({ ...action, key });
      return;
    }

    if (action.op === 'bind') {
      const source = resolveNodeId(action, 'source', nodeIds, pendingRefs);
      const target = resolveNodeId(action, 'target', nodeIds, pendingRefs);
      if (!source || !target) {
        issues.push({ index, message: 'bind requires source and target node identifiers.' });
        return;
      }
      const sourcePort = readAiStringField(action.sourcePort);
      const targetPort = readAiStringField(action.targetPort);
      if (!sourcePort || !targetPort) {
        issues.push({
          index,
          message: 'bind requires sourcePort and targetPort as text port ids.',
        });
        return;
      }

      const sourceNode = nodes.find((node) => node.id === source);
      const targetNode = nodes.find((node) => node.id === target);
      if (sourceNode && !sourceNode.outputs.includes(sourcePort)) {
        issues.push({ index, message: `Unknown output port ${sourcePort} on ${source}.` });
        return;
      }
      if (targetNode && !targetNode.inputs.includes(targetPort)) {
        issues.push({ index, message: `Unknown input port ${targetPort} on ${target}.` });
        return;
      }

      if (sourceNode && targetNode) {
        const sourceDef = registry.get(sourceNode.type);
        const targetDef = registry.get(targetNode.type);
        const sourcePortDef = sourceDef?.outputs.find((port) => port.id === sourcePort);
        const targetPortDef = targetDef?.inputs.find((port) => port.id === targetPort);
        if (
          sourcePortDef &&
          targetPortDef &&
          !areDataTypesCompatible(sourcePortDef.dataType, targetPortDef.dataType)
        ) {
          issues.push({
            index,
            message: `Incompatible bind: ${sourcePortDef.dataType} → ${targetPortDef.dataType}`,
          });
          return;
        }
      }

      applicableActions.push({ ...action, sourcePort, targetPort });
    }
  });

  return {
    valid: issues.length === 0,
    issues,
    applicableActions,
    explainActions,
  };
}
