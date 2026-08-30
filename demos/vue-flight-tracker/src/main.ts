import { createApp } from 'vue';
import { registerRosettaDashElements } from '@rosettadash/web-components';
import '../../../packages/web-components/src/styles/styles.css';
import App from './App.vue';
import './host.css';

registerRosettaDashElements();
createApp(App).mount('#app');
