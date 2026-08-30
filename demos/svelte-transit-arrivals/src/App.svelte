<script lang="ts">
  import TransitArrivals from './TransitArrivals.svelte';
</script>

<div class="rd-demo-page">
  <header class="rd-demo-page__intro">
    <p class="rd-demo-page__eyebrow">Host page</p>
    <h1>Platform board</h1>
    <p>
      The block on the right is <code>TransitArrivals</code> — a Svelte drop-in composed from
      RosettaDash map, select, KPI, table, timer, and detail atoms. Arrivals come from MBTA.
    </p>
  </header>
  <TransitArrivals />
</div>
