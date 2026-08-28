import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'da-bound-text-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rd-input-text">
      @if (fieldLabel()) {
        <span class="rd-field__label">{{ fieldLabel() }}</span>
      }
      <input
        class="rd-input"
        [type]="inputType()"
        [placeholder]="placeholder() ?? ''"
        [value]="value()"
        (input)="valueChange.emit($any($event.target).value)"
      />
    </section>
  `,
})
export class DaBoundTextInputComponent {
  readonly fieldLabel = input<string>();
  readonly placeholder = input<string>();
  readonly value = input('');
  readonly inputType = input<'text' | 'password'>('text');
  readonly valueChange = output<string>();
}

@Component({
  selector: 'da-bound-select-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rd-input-select">
      @if (fieldLabel()) {
        <span class="rd-field__label">{{ fieldLabel() }}</span>
      }
      <select
        class="rd-select"
        (change)="valueChange.emit($any($event.target).value)"
      >
        @if (placeholder()) {
          <option value="" [selected]="!value()">{{ placeholder() }}</option>
        }
        @for (option of options(); track option.value) {
          <option [value]="option.value" [selected]="option.value === value()">{{ option.label }}</option>
        }
      </select>
    </section>
  `,
})
export class DaBoundSelectInputComponent {
  readonly fieldLabel = input<string>();
  readonly placeholder = input<string>();
  readonly value = input('');
  readonly options = input<Array<{ value: string; label: string }>>([]);
  readonly valueChange = output<string>();
}

@Component({
  selector: 'da-bound-textarea-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rd-input-textarea">
      @if (fieldLabel()) {
        <span class="rd-field__label">{{ fieldLabel() }}</span>
      }
      <textarea
        class="rd-textarea"
        [rows]="rows()"
        [placeholder]="placeholder() ?? ''"
        [value]="value()"
        (input)="valueChange.emit($any($event.target).value)"
      ></textarea>
    </section>
  `,
})
export class DaBoundTextareaInputComponent {
  readonly fieldLabel = input<string>();
  readonly placeholder = input<string>();
  readonly value = input('');
  readonly rows = input(4);
  readonly valueChange = output<string>();
}
