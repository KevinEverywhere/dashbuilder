import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType,
} from 'vue';

type AttrValue = string | number | boolean | undefined | null;

export interface CustomElementHostOptions {
  name: string;
  tagName: string;
  register: () => void;
  /** Prop name → attribute name (omit for same kebab conversion). */
  attrs?: Record<string, string>;
  /** Prop keys synced via `element.setProperty(name, value)` when available. */
  properties?: string[];
  /** DOM event name → Vue emit name. */
  events?: Record<string, string>;
}

function toKebab(name: string): string {
  return name.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
}

function syncAttributes(
  el: HTMLElement,
  props: Record<string, AttrValue>,
  propKeys: string[],
  attrMap: Record<string, string>,
): void {
  for (const key of propKeys) {
    const attr = attrMap[key] ?? toKebab(key);
    const value = props[key];
    if (value === undefined || value === null || value === false) {
      if (el.hasAttribute(attr)) {
        el.removeAttribute(attr);
      }
      continue;
    }
    const next = value === true ? '' : String(value);
    if (el.getAttribute(attr) === next) {
      continue;
    }
    if (value === true) {
      el.setAttribute(attr, '');
    } else {
      el.setAttribute(attr, String(value));
    }
  }
}

function syncProperties(
  el: HTMLElement,
  props: Record<string, unknown>,
  propertyKeys: string[],
): void {
  const setProperty = (el as { setProperty?: (name: string, value: unknown) => void })
    .setProperty;
  if (typeof setProperty !== 'function') {
    return;
  }
  for (const key of propertyKeys) {
    setProperty.call(el, key, props[key]);
  }
}

/**
 * Thin Vue wrapper factory around a registered custom element.
 * Attributes are applied with setAttribute only (WC hosts often expose
 * getters without setters, so Vue must not assign DOM properties).
 */
export function defineCustomElementHost(
  options: CustomElementHostOptions,
  propDefs: Record<string, unknown>,
) {
  const attrMap = options.attrs ?? {};
  const eventMap = options.events ?? {};
  const propKeys = Object.keys(propDefs);
  const propertyKeys = options.properties ?? [];

  return defineComponent({
    name: options.name,
    props: {
      className: {
        type: String as PropType<string | undefined>,
        default: undefined,
      },
      ...propDefs,
    },
    emits: [...new Set([...Object.keys(eventMap), ...Object.values(eventMap)])],
    setup(props, { emit, attrs }) {
      options.register();
      const host = ref<HTMLElement | null>(null);
      const listeners: Array<[string, EventListener]> = [];

      function applyAttrs(): void {
        if (host.value) {
          syncAttributes(
            host.value,
            props as Record<string, AttrValue>,
            propKeys,
            attrMap,
          );
          syncProperties(host.value, props as Record<string, unknown>, propertyKeys);
        }
      }

      onMounted(() => {
        const el = host.value;
        if (!el) {
          return;
        }
        applyAttrs();
        for (const [domEvent, vueEvent] of Object.entries(eventMap)) {
          const handler: EventListener = (event) => {
            const detail = (event as CustomEvent).detail;
            emit(vueEvent, detail);
            if (domEvent !== vueEvent) {
              emit(domEvent, detail);
            }
          };
          el.addEventListener(domEvent, handler);
          listeners.push([domEvent, handler]);
        }
      });

      onBeforeUnmount(() => {
        const el = host.value;
        for (const [domEvent, handler] of listeners) {
          el?.removeEventListener(domEvent, handler);
        }
      });

      watch(
        () => [
          ...propKeys.map((key) => (props as Record<string, AttrValue>)[key]),
          ...propertyKeys.map((key) => (props as Record<string, unknown>)[key]),
        ],
        () => applyAttrs(),
      );

      return () =>
        h(options.tagName, {
          ref: host,
          class:
            [props.className, attrs.class].filter(Boolean).join(' ') ||
            undefined,
        });
    },
  });
}
