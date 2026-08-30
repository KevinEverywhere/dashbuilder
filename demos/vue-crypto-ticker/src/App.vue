<script setup lang="ts">
import CryptoTicker from './CryptoTicker.vue';
</script>

<template>
  <div class="rd-demo-page">
    <header class="rd-demo-page__intro">
      <p class="rd-demo-page__eyebrow">Host page</p>
      <h1>Markets sidebar</h1>
      <p>
        The block on the right is <code>CryptoTicker</code> — a Vue drop-in composed from
        RosettaDash select, KPI, badge, chart, table, and detail atoms.
      </p>
    </header>
    <CryptoTicker />
  </div>
</template>
