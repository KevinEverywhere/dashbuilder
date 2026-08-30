import { mount } from 'svelte';
import { registerRosettaDashElements } from '@rosettadash/web-components';
import '../../../packages/web-components/src/styles/styles.css';
import App from './App.svelte';
import './host.css';

registerRosettaDashElements();

const target = document.getElementById('app');
if (!target) {
  throw new Error('Missing #app mount target');
}

mount(App, { target });
