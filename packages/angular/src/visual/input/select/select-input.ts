import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export interface SelectInputOption {
  value: string;
  label: string;
}

export interface SelectInputProps {
  label?: string;
  placeholder?: string;
  options?: SelectInputOption[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

/** @rosettadash/angular/visual/input/select — visual.input.select */
@Component({
  selector: 'rd-input-select',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [attr.data-testid]="'rd-input-select'" [ngClass]="rootClass()">
      @if (label()) {
        <span class="rd-field__label">{{ label() }}</span>
      }
      <select class="rd-select" (change)="onNativeChange($event)">
        <option value="" [selected]="!(value() ?? '')">{{ placeholder() ?? 'Select…' }}</option>
        @for (o of options() ?? []; track o.value) {
          <option [value]="o.value" [selected]="o.value === (value() ?? '')">{{ o.label }}</option>
        }
      </select>
      <ng-content />
    </section>
  `,
})
export class SelectInput {
  readonly className = input<string | undefined>(undefined);
  readonly label = input<string | undefined>(undefined);
  readonly placeholder = input<string | undefined>(undefined);
  readonly options = input<SelectInputOption[] | undefined>(undefined);
  readonly value = input<string | undefined>(undefined);
  readonly onChange = input<((value: string) => void) | undefined>(undefined);
  readonly valueChange = output<string>();

  readonly rootClass = computed(() =>
    ['rd-input-select', this.className()].filter(Boolean).join(' '),
  );

  protected onNativeChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }
    this.onChange()?.(target.value);
    this.valueChange.emit(target.value);
  }
}
