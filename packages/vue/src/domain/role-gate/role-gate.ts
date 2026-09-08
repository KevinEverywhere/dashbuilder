import { defineComponent, h, type PropType, type SlotsType, type VNode } from 'vue';

export interface RoleGateProps {
  label?: string;
  allowedRoles?: string[];
  /** Active session role — when omitted, content is always shown (builder/demo mode). */
  currentRole?: string;
  statusText?: string;
  hiddenStatusText?: string;
  /** When denied, render nothing instead of a hidden-status message. */
  hideWhenDenied?: boolean;
  className?: string;
}

function roleGateAllowsRole(allowedRoles: string[], roleId: string): boolean {
  const normalizedRole = roleId.trim();
  if (!normalizedRole) {
    return false;
  }
  return allowedRoles.some((allowed) => allowed === normalizedRole);
}

/** @rosettadash/vue/domain/role-gate — domain.role-gate */
export const RoleGate = defineComponent({
  name: 'RdRoleGate',
  props: {
    className: { type: String as PropType<string | undefined>, default: undefined },
    label: { type: String as PropType<string | undefined>, default: undefined },
    allowedRoles: { type: Array as PropType<string[] | undefined>, default: undefined },
    currentRole: { type: String as PropType<string | undefined>, default: undefined },
    statusText: { type: String as PropType<string | undefined>, default: undefined },
    hiddenStatusText: { type: String as PropType<string | undefined>, default: undefined },
    hideWhenDenied: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(props, { slots, attrs }) {
    return () => {
      const allowedRoles = props.allowedRoles ?? [];
      const hasRoleContext = props.currentRole !== undefined && props.currentRole !== '';
      const visible =
        !hasRoleContext ||
        allowedRoles.length === 0 ||
        roleGateAllowsRole(allowedRoles, props.currentRole ?? '');

      if (!visible && props.hideWhenDenied) {
        return null;
      }

      const rootClass = [
        'rd-role-gate',
        visible ? 'rd-role-gate--visible' : 'rd-role-gate--hidden',
        props.className,
        typeof attrs.class === 'string' ? attrs.class : '',
      ]
        .filter(Boolean)
        .join(' ');

      return h('section', { class: rootClass, 'data-testid': 'rd-role-gate' }, [
        props.label ? h('span', { class: 'rd-field__label' }, props.label) : null,
        visible
          ? [
              h('p', { class: 'rd-role-gate__status', 'data-testid': 'rd-role-gate-visible' }, props.statusText ?? 'Visible'),
              slots.default?.(),
            ]
          : h(
              'p',
              {
                class: 'rd-role-gate__status rd-role-gate__status--hidden',
                'data-testid': 'rd-role-gate-hidden',
              },
              props.hiddenStatusText ?? 'Hidden for current role',
            ),
      ]);
    };
  },
});

export type RoleGateComponent = typeof RoleGate;
