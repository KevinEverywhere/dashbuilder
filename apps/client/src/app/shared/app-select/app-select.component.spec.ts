import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AppSelectComponent } from './app-select.component';

describe('AppSelectComponent', () => {
  let fixture: ComponentFixture<AppSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, AppSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppSelectComponent);
    fixture.componentRef.setInput('options', [
      { value: 'viewer', label: 'Viewer' },
      { value: 'admin', label: 'Admin' },
    ]);
    fixture.componentRef.setInput('testId', 'role-select');
    fixture.detectChanges();
  });

  it('opens a fixed-position menu anchored to the trigger', async () => {
    fixture.nativeElement.querySelector('[data-testid="role-select-trigger"]').click();
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    const menu = fixture.nativeElement.querySelector('[data-testid="role-select-menu"]') as HTMLElement;
    expect(menu).toBeTruthy();
    expect(menu.classList.contains('app-select__menu--positioned')).toBe(true);
    expect(getComputedStyle(menu).position).toBe('fixed');
  });

  it('emits the selected value', () => {
    const selected: string[] = [];
    fixture.componentInstance.valueChange.subscribe((value) => selected.push(String(value)));

    fixture.nativeElement.querySelector('[data-testid="role-select-trigger"]').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-testid="role-select-option-admin"]').click();
    fixture.detectChanges();

    expect(selected).toEqual(['admin']);
    expect(fixture.nativeElement.querySelector('.app-select__value').textContent).toContain(
      'Admin',
    );
  });
});
