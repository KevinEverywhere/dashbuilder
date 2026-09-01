import { NgStyle } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface AppSelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select',
  imports: [NgStyle],
  templateUrl: './app-select.component.html',
  styleUrl: './app-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppSelectComponent),
      multi: true,
    },
  ],
})
export class AppSelectComponent implements ControlValueAccessor {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly options = input.required<readonly AppSelectOption[]>();
  readonly placeholder = input('Select…');
  readonly testId = input<string | undefined>(undefined);
  readonly disabled = input(false);
  readonly resetAfterSelect = input(false);
  readonly emptyOptionLabel = input<string | null>(null);

  readonly valueChange = output<string>();

  protected readonly open = signal(false);
  protected readonly menuPositioned = signal(false);
  protected readonly menuStyle = signal<Record<string, string>>({});

  private readonly triggerRef = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menuRef = viewChild<ElementRef<HTMLUListElement>>('menu');

  private readonly currentValue = signal('');
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private formDisabled = false;

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }

      const menu = this.menuRef();
      if (!menu) {
        return;
      }

      queueMicrotask(() => {
        this.positionMenu();
        this.menuPositioned.set(true);
      });
    });
  }

  writeValue(value: string | null | undefined): void {
    this.currentValue.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled = isDisabled;
  }

  protected isDisabled(): boolean {
    return this.disabled() || this.formDisabled;
  }

  protected selectedLabel(): string {
    const current = this.currentValue();
    if (current === '' && this.emptyOptionLabel()) {
      return this.emptyOptionLabel() as string;
    }

    const match = this.options().find((option) => this.valuesEqual(option.value, current));
    return match?.label ?? this.placeholder();
  }

  protected isSelected(value: string): boolean {
    return this.valuesEqual(value, this.currentValue());
  }

  protected isEmptySelected(): boolean {
    return this.currentValue() === '';
  }

  protected optionTestId(value: string): string {
    const base = this.testId() ?? 'app-select';
    return `${base}-option-${String(value)}`;
  }

  protected emptyOptionTestId(): string {
    const base = this.testId() ?? 'app-select';
    return `${base}-option-empty`;
  }

  protected toggleMenu(): void {
    if (this.isDisabled()) {
      return;
    }

    if (this.open()) {
      this.closeMenu();
      return;
    }

    this.menuPositioned.set(false);
    this.menuStyle.set({});
    this.open.set(true);
  }

  protected pick(value: string): void {
    if (this.isDisabled()) {
      return;
    }

    this.currentValue.set(value);
    this.onChange(value);
    this.onTouched();
    this.valueChange.emit(value);
    this.closeMenu();

    if (this.resetAfterSelect()) {
      queueMicrotask(() => {
        this.currentValue.set('');
        this.onChange('');
      });
    }
  }

  protected pickEmpty(): void {
    if (this.isDisabled() || this.emptyOptionLabel() === null) {
      return;
    }

    this.currentValue.set('');
    this.onChange('');
    this.onTouched();
    this.valueChange.emit('');
    this.closeMenu();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.open()) {
      return;
    }

    const target = event.target;
    if (target instanceof Node && this.host.nativeElement.contains(target)) {
      return;
    }

    this.closeMenu();
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeMenu();
    }
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  protected onViewportChange(): void {
    if (this.open()) {
      this.positionMenu();
    }
  }

  private closeMenu(): void {
    this.open.set(false);
    this.menuPositioned.set(false);
    this.menuStyle.set({});
    this.onTouched();
  }

  private positionMenu(): void {
    const trigger = this.triggerRef()?.nativeElement;
    const menu = this.menuRef()?.nativeElement;
    if (!trigger || !menu) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const menuHeight = menu.offsetHeight;
    const viewportPadding = 8;
    const gap = 4;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    const openUpward = menuHeight + gap > spaceBelow && spaceAbove > spaceBelow;

    this.menuStyle.set({
      left: `${Math.max(viewportPadding, Math.min(rect.left, window.innerWidth - rect.width - viewportPadding))}px`,
      top: openUpward
        ? `${Math.max(viewportPadding, rect.top - menuHeight - gap)}px`
        : `${rect.bottom + gap}px`,
      width: `${rect.width}px`,
    });
  }

  private valuesEqual(left: string, right: string): boolean {
    return left === right;
  }
}
