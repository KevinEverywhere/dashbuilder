<script lang="ts">
  import '@angular/compiler';
  import {
    createComponent,
    provideZonelessChangeDetection,
    type ApplicationRef,
    type ComponentRef,
    type Type,
  } from '@angular/core';
  import { createApplication } from '@angular/platform-browser';

  let {
    component,
    componentInputs = {},
    tagName = 'div',
    className,
  }: {
    component: Type<unknown>;
    componentInputs?: Record<string, unknown>;
    tagName?: string;
    className?: string;
  } = $props();

  let host = $state<HTMLElement | null>(null);
  let appRef: ApplicationRef | null = null;
  let cmpRef: ComponentRef<unknown> | null = null;

  async function ensureApp(): Promise<ApplicationRef> {
    if (appRef) {
      return appRef;
    }
    appRef = await createApplication({
      providers: [provideZonelessChangeDetection()],
    });
    return appRef;
  }

  $effect(() => {
    const el = host;
    const cmp = component;
    const inputs = componentInputs;
    if (!el) {
      return;
    }
    void (async () => {
      const application = await ensureApp();
      if (!cmpRef) {
        cmpRef = createComponent(cmp, {
          environmentInjector: application.injector,
          hostElement: el,
        });
        application.attachView(cmpRef.hostView);
      }
      for (const [key, value] of Object.entries(inputs)) {
        cmpRef.setInput(key, value);
      }
      cmpRef.changeDetectorRef.detectChanges();
    })();
  });

  $effect(() => {
    return () => {
      cmpRef?.destroy();
      cmpRef = null;
    };
  });
</script>

<svelte:element this={tagName} bind:this={host} class={className}></svelte:element>
