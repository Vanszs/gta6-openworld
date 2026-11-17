// Browser entry point for NEON WAKE.
import { startApp } from './app.js';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');

if (canvas) {
  startApp(canvas, statusEl);
}
