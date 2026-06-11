import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App.jsx';
import { setupGlobalErrorHandlers } from './utils/globalErrors';
import { purgeLegacyApiCaches } from './utils/pwaCache';
import { PWA_UPDATE_EVENT } from './components/pwa/PwaUpdateBanner.jsx';

setupGlobalErrorHandlers();
purgeLegacyApiCaches();

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(
      new CustomEvent(PWA_UPDATE_EVENT, {
        detail: { applyUpdate: updateSW },
      })
    );
  },
  onOfflineReady() {
    console.info('[PWA] Interfaz lista para uso sin conexión (los datos de ventas siempre se consultan en línea).');
  },
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      setInterval(() => registration.update(), 60 * 60 * 1000);
    }
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
