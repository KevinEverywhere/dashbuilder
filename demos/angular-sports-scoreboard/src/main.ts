import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { registerRosettaDashElements } from '@rosettadash/web-components';
import '../../../packages/web-components/src/styles/styles.css';
import { SportsHostComponent } from './host.component';
import './host.css';

registerRosettaDashElements();

bootstrapApplication(SportsHostComponent, {
  providers: [provideZonelessChangeDetection()],
}).catch((error) => {
  console.error(error);
});
