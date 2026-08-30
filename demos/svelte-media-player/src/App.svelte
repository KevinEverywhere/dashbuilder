<script lang="ts">
  import MediaPlayer from './MediaPlayer.svelte';
</script>

<div class="rd-demo-page">
  <header class="rd-demo-page__intro">
    <p class="rd-demo-page__eyebrow">Host page</p>
    <h1>Screening desk</h1>
    <p>
      The block on the right is <code>MediaPlayer</code> — a Svelte drop-in composed from
      RosettaDash select, KPI, badge, timer, and detail atoms around a native HTML video.
    </p>
  </header>
  <MediaPlayer />
</div>
