import type { ComponentDefinition, ComponentNode, Port } from '../model/types';
import { enrichComponentProperties } from '../presentation/presentation-layout';
import type { ComponentPlugin } from './component-plugin';
import { EXTENSION_COMPONENT_PLUGINS } from './extension-component-plugins';
import { NEWS_COMPONENT_PLUGINS } from './news-component-plugins';
import { MEDIA_COMPONENT_PLUGINS } from './media-component-plugins';
import { SVG_COMPONENT_PLUGINS } from './svg-component-plugins';
import { VR_COMPONENT_PLUGINS } from './vr-component-plugins';
import { WASM_COMPONENT_PLUGINS } from './wasm-component-plugins';
import { P0_COMPONENT_DEFINITIONS } from './p0-components';

export class ComponentRegistry {
  private readonly definitions = new Map<string, ComponentDefinition>();
  private readonly plugins = new Map<string, ComponentPlugin>();

  constructor(definitions: ComponentDefinition[] = P0_COMPONENT_DEFINITIONS) {
    for (const definition of definitions) {
      this.register(definition);
    }
  }

  register(definition: ComponentDefinition): void {
    if (this.definitions.has(definition.type)) {
      throw new Error(`Component type already registered: ${definition.type}`);
    }
    this.definitions.set(definition.type, definition);
  }

  registerPlugin(plugin: ComponentPlugin): void {
    if (this.plugins.has(plugin.definition.type)) {
      throw new Error(`Component plugin already registered: ${plugin.definition.type}`);
    }
    this.register(plugin.definition);
    this.plugins.set(plugin.definition.type, plugin);
  }

  getPlugin(type: string): ComponentPlugin | undefined {
    return this.plugins.get(type);
  }

  listPlugins(): ComponentPlugin[] {
    return [...this.plugins.values()].sort((left, right) =>
      left.definition.label.localeCompare(right.definition.label),
    );
  }

  isPluginType(type: string): boolean {
    return this.plugins.has(type);
  }

  get(type: string): ComponentDefinition | undefined {
    return this.definitions.get(type);
  }

  getOrThrow(type: string): ComponentDefinition {
    const definition = this.get(type);
    if (!definition) {
      throw new Error(`Unknown component type: ${type}`);
    }
    return definition;
  }

  list(): ComponentDefinition[] {
    return [...this.definitions.values()].sort((a, b) => a.label.localeCompare(b.label));
  }

  listByCategory(category: ComponentDefinition['category']): ComponentDefinition[] {
    return this.list().filter((d) => d.category === category);
  }

  createNode(type: string, overrides: Partial<Pick<ComponentNode, 'id' | 'label' | 'properties' | 'layout'>> = {}): ComponentNode {
    const definition = this.getOrThrow(type);
    const properties = this.defaultProperties(definition);

    return {
      id: overrides.id ?? crypto.randomUUID(),
      type: definition.type,
      label: overrides.label ?? definition.label,
      properties: enrichComponentProperties(definition.type, {
        ...properties,
        ...overrides.properties,
      }),
      ports: {
        inputs: definition.inputs.map((p) => ({ ...p })),
        outputs: definition.outputs.map((p) => ({ ...p })),
      },
      layout: overrides.layout,
      meta: { suggestedBy: 'user' },
    };
  }

  defaultProperties(definition: ComponentDefinition): Record<string, unknown> {
    const properties: Record<string, unknown> = {};
    for (const schema of definition.properties) {
      if (schema.default !== undefined) {
        properties[schema.key] = schema.default;
      }
    }
    return properties;
  }

  findPort(node: ComponentNode, portId: string, direction: 'input' | 'output'): Port | undefined {
    const ports = direction === 'input' ? node.ports.inputs : node.ports.outputs;
    return ports.find((p) => p.id === portId);
  }
}

export const defaultComponentRegistry = new ComponentRegistry();

for (const plugin of EXTENSION_COMPONENT_PLUGINS) {
  defaultComponentRegistry.registerPlugin(plugin);
}

for (const plugin of NEWS_COMPONENT_PLUGINS) {
  defaultComponentRegistry.registerPlugin(plugin);
}

for (const plugin of VR_COMPONENT_PLUGINS) {
  defaultComponentRegistry.registerPlugin(plugin);
}

for (const plugin of SVG_COMPONENT_PLUGINS) {
  defaultComponentRegistry.registerPlugin(plugin);
}

for (const plugin of WASM_COMPONENT_PLUGINS) {
  defaultComponentRegistry.registerPlugin(plugin);
}

for (const plugin of MEDIA_COMPONENT_PLUGINS) {
  defaultComponentRegistry.registerPlugin(plugin);
}
