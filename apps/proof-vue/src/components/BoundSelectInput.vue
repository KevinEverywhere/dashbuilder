<script setup lang="ts">
defineProps<{
  fieldLabel?: string;
  placeholder?: string;
  value?: string;
  options?: Array<{ value: string; label: string }>;
}>();

const emit = defineEmits<{ 'update:value': [string] }>();
</script>

<template>
  <section class="rd-input-select">
    <span v-if="fieldLabel" class="rd-field__label">{{ fieldLabel }}</span>
    <select
      class="rd-select"
      :value="value ?? ''"
      @change="emit('update:value', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder" value="" :selected="!(value ?? '')">{{ placeholder }}</option>
      <option
        v-for="option in options ?? []"
        :key="option.value"
        :value="option.value"
        :selected="option.value === (value ?? '')"
      >
        {{ option.label }}
      </option>
    </select>
  </section>
</template>
