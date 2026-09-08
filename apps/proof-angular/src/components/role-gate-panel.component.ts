import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { roleAllows, roleLabel, type AtlasUserRole } from '../lib/roles';

@Component({
  selector: 'da-role-gate-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (allowed()) {
      <section class="rd-role-gate">
        @if (gateLabel()) {
          <span class="rd-field__label">{{ gateLabel() }}</span>
        }
        @if (statusText()) {
          <p class="rd-role-gate__status">{{ statusText() }}</p>
        }
        <ng-content />
      </section>
    } @else if (!hideWhenDenied()) {
      <p class="rd-role-gate__status rd-role-gate__status--hidden">{{ hiddenMessage() }}</p>
    }
  `,
})
export class RoleGatePanelComponent {
  readonly gateLabel = input<string>();
  readonly currentRole = input.required<AtlasUserRole>();
  readonly allowedRoles = input<string[]>(['admin']);
  readonly statusText = input<string>();
  readonly hiddenStatusText = input<string>();
  readonly hideWhenDenied = input(false);

  readonly allowed = computed(() => roleAllows(this.currentRole(), this.allowedRoles()));

  readonly hiddenMessage = computed(() => {
    if (this.hiddenStatusText()) {
      return this.hiddenStatusText();
    }
    return `This section is hidden for ${roleLabel(this.currentRole())} role.`;
  });
}
