<script lang="ts">
  let {
    fieldLabel,
    placeholder,
    value = '',
    options = [],
    onValueChange,
  }: {
    fieldLabel?: string;
    placeholder?: string;
    value?: string;
    options?: Array<{ value: string; label: string }>;
    onValueChange?: (value: string) => void;
  } = $props();
</script>

<section class="rd-input-select">
  {#if fieldLabel}<span class="rd-field__label">{fieldLabel}</span>{/if}
  <select
    class="rd-select"
    onchange={(event) => onValueChange?.((event.currentTarget as HTMLSelectElement).value)}
  >
    {#if placeholder}<option value="" selected={!(value ?? '')}>{placeholder}</option>{/if}
    {#each options as option (option.value)}
      <option value={option.value} selected={option.value === (value ?? '')}>{option.label}</option>
    {/each}
  </select>
</section>
