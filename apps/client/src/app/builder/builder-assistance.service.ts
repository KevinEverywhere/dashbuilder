import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'rosettadash:builder:how-it-works-assistance';

function readStoredPreference(): boolean {
  if (typeof localStorage === 'undefined') {
    return false;
  }
  return localStorage.getItem(STORAGE_KEY) === '1';
}

/** Persists whether canvas/palette "How it works" assistance is enabled (default: inspector-only). */
@Injectable({ providedIn: 'root' })
export class BuilderAssistanceService {
  readonly howItWorksEnabled = signal(readStoredPreference());

  isHowItWorksEnabled(): boolean {
    return this.howItWorksEnabled();
  }

  chooseInspectorOnly(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, '0');
    }
    this.howItWorksEnabled.set(false);
  }

  enableHowItWorksAssistance(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, '1');
    }
    this.howItWorksEnabled.set(true);
  }

  toggleHowItWorksAssistance(): void {
    if (this.howItWorksEnabled()) {
      this.chooseInspectorOnly();
    } else {
      this.enableHowItWorksAssistance();
    }
  }
}
