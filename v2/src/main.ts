/**
 * Application entry point.
 * Mounts the root component into <div id="app">.
 */

import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';

const target = document.getElementById('app');
if (!target) {
  throw new Error('Mount target #app not found in DOM');
}

const app = mount(App, { target });

export default app;
