import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { registerVariant } from './variants/registry';
import { classicManifest } from './variants/classic';
import { parityManifest } from './variants/parity';
import { sumDiffManifest } from './variants/sumDiff';
import { registerSW } from './registerSW';
import './index.css';

registerVariant(classicManifest);
registerVariant(parityManifest);
registerVariant(sumDiffManifest);

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

void registerSW();
