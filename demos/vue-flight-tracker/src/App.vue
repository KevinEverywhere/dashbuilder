<script setup lang="ts">
import FlightTracker from './FlightTracker.vue';
</script>

<template>
  <div class="rd-demo-page">
    <header class="rd-demo-page__intro">
      <p class="rd-demo-page__eyebrow">Host page</p>
      <h1>Arrivals board</h1>
      <p>
        The block on the right is <code>FlightTracker</code> — a Vue drop-in composed from
        RosettaDash map, KPI, badge, table, and detail atoms.
      </p>
    </header>
    <FlightTracker />
  </div>
</template>
