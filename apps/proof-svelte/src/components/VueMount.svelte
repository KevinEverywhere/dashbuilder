<script lang="ts">
  import { createApp, h, reactive, type Component } from 'vue';

  let {
    component,
    componentProps = {},
  }: {
    component: Component;
    componentProps?: Record<string, unknown>;
  } = $props();

  const liveProps = reactive<Record<string, unknown>>({});

  $effect(() => {
    const snapshot = componentProps;
    for (const key of Object.keys(liveProps)) {
      if (!(key in snapshot)) {
        delete liveProps[key];
      }
    }
    Object.assign(liveProps, snapshot);
  });
</script>

<div
  {@attach (node) => {
    const vueApp = createApp({
      render: () => h(component, liveProps),
    });
    vueApp.mount(node);
    return () => vueApp.unmount();
  }}
></div>
