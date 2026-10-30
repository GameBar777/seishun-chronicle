import './ui/styles.css';
import { App } from './ui/app';
const app = new App(document.getElementById('app')!);
app.boot();
(window as any).__ripple = app; // debug / e2e hook (read-only use)
