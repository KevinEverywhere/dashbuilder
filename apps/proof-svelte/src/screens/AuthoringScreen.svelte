<script module lang="ts">
  export const AUTHORING_SOURCE = `<AuthoringScreen locale={locale} selectedId={selectedId}>
  <!-- Cross-framework: Svelte shell mounts React Authoring via ReactMount -->
  <ReactMount component={AuthoringScreenReact} componentProps={{ locale, selectedId }} />
  <!-- React subtree: EquirectSphereViewport, FlatVideoViewport, WasmMedia (@rosettadash/react) -->
</AuthoringScreen>`;
</script>

<script lang="ts">
  import ReactMount from '../components/ReactMount.svelte';
  import { AuthoringScreen as AuthoringScreenReact } from '../authoring/AuthoringScreen';

  let { locale, selectedId }: { locale: string; selectedId: string } = $props();

  const componentProps = $derived({ locale, selectedId });
</script>

<div class="da-interop-callout" role="note">
  <strong>Cross-framework showcase.</strong>
  This screen is a Svelte wrapper around a React subtree (<code>ReactMount.svelte</code> →
  <code>authoring/AuthoringScreen.tsx</code>) — the React example of four DAS-158
  cross-framework hosts. See About → Cross-framework composition.
</div>
<ReactMount component={AuthoringScreenReact} {componentProps} />
