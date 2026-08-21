import { TestBed } from '@angular/core/testing';
import { BuilderAssistanceService } from './builder-assistance.service';

describe('BuilderAssistanceService', () => {
  let service: BuilderAssistanceService;

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    TestBed.configureTestingModule({});
    service = TestBed.inject(BuilderAssistanceService);
  });

  it('defaults to inspector-only (How it works off)', () => {
    expect(service.isHowItWorksEnabled()).toBe(false);
  });

  it('persists How it works assistance when enabled', () => {
    service.enableHowItWorksAssistance();
    expect(service.isHowItWorksEnabled()).toBe(true);
    if (typeof localStorage === 'undefined') {
      return;
    }
    expect(localStorage.getItem('rosettadash:builder:how-it-works-assistance')).toBe('1');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(BuilderAssistanceService);
    expect(reloaded.isHowItWorksEnabled()).toBe(true);
  });

  it('persists inspector-only when chosen', () => {
    service.enableHowItWorksAssistance();
    service.chooseInspectorOnly();
    expect(service.isHowItWorksEnabled()).toBe(false);
    if (typeof localStorage !== 'undefined') {
      expect(localStorage.getItem('rosettadash:builder:how-it-works-assistance')).toBe('0');
    }
  });

  it('toggles How it works assistance', () => {
    expect(service.isHowItWorksEnabled()).toBe(false);
    service.toggleHowItWorksAssistance();
    expect(service.isHowItWorksEnabled()).toBe(true);
    service.toggleHowItWorksAssistance();
    expect(service.isHowItWorksEnabled()).toBe(false);
  });
});
