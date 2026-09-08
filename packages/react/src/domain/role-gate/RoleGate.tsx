import { forwardRef, type CSSProperties, type ReactNode } from 'react';

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
  style?: CSSProperties;
  children?: ReactNode;
}

function roleGateAllowsRole(allowedRoles: string[], roleId: string): boolean {
  const normalizedRole = roleId.trim();
  if (!normalizedRole) {
    return false;
  }
  return allowedRoles.some((allowed) => allowed === normalizedRole);
}

/** @rosettadash/react/domain/role-gate — domain.role-gate */
export const RoleGate = forwardRef<HTMLElement, RoleGateProps>(function RoleGate(
  props,
  ref,
) {
  const { className, style, children } = props;
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
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={rootClass}
      style={style}
      data-testid="rd-role-gate"
    >
      {props.label ? <span className="rd-field__label">{props.label}</span> : null}
      {visible ? (
        <>
          <p className="rd-role-gate__status" data-testid="rd-role-gate-visible">
            {props.statusText ?? 'Visible'}
          </p>
          {children}
        </>
      ) : (
        <p
          className="rd-role-gate__status rd-role-gate__status--hidden"
          data-testid="rd-role-gate-hidden"
        >
          {props.hiddenStatusText ?? 'Hidden for current role'}
        </p>
      )}
    </section>
  );
});
