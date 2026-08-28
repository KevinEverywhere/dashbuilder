<script setup lang="ts">
import { RoleGate } from '@rosettadash/vue/domain/role-gate';
import { roleLabel, type AtlasUserRole } from '../lib/roles';

const props = withDefaults(
  defineProps<{
    gateLabel?: string;
    currentRole: AtlasUserRole;
    allowedRoles?: string[];
    statusText?: string;
    hiddenStatusText?: string;
  }>(),
  {
    allowedRoles: () => ['admin'],
  },
);
</script>

<template>
  <RoleGate
    :label="gateLabel"
    :current-role="currentRole"
    :allowed-roles="allowedRoles"
    :status-text="statusText"
    :hidden-status-text="hiddenStatusText ?? `This section is hidden for ${roleLabel(props.currentRole)} role.`"
  >
    <slot />
  </RoleGate>
</template>
