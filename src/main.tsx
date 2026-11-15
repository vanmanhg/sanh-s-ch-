import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Google Maps Platform Quota Defense & Auth Failure Listeners
(window as any).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  window.dispatchEvent(new CustomEvent('gmp-auth-failed'));
};

const origError = console.error;
console.error = (...args: unknown[]) => {
  const msg = args.map((a) => String(a)).join(' ');
  // Suppress Vite HMR WebSocket connection failure in iFrame proxy
  if (msg.includes('WebSocket') || msg.includes('websocket')) {
    return;
  }
  // Suppress Google Maps API key / authorization errors and trigger fallback to cached static map
  if (
    msg.includes('InvalidKeyMapError') ||
    msg.includes('ApiProjectMapError') ||
    msg.includes('RequestDeniedMapError') ||
    msg.includes('RefererNotAllowedMapError') ||
    msg.includes('BillingNotEnabledMapError') ||
    msg.includes('gm_authFailure') ||
    msg.includes('developers.google.com/maps/documentation/javascript/error-messages')
  ) {
    try {
      window.dispatchEvent(new CustomEvent('gmp-auth-failed'));
    } catch {}
    return;
  }
  origError.apply(console, args);
  if (
    msg.includes('OverQuotaMapError') ||
    msg.includes('QuotaExceededError') ||
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('RESOURCE_EXHAUSTED')
  ) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

window.addEventListener('error', (event) => {
  const msg = event?.message || '';
  if (
    msg === 'Script error.' ||
    msg.includes('WebSocket') ||
    msg.includes('websocket') ||
    msg.includes('Google Maps') ||
    msg.includes('InvalidKeyMapError') ||
    msg.includes('OverQuotaMapError') ||
    msg.includes('maps.googleapis')
  ) {
    try {
      if (msg.includes('OverQuotaMapError')) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      } else {
        window.dispatchEvent(new CustomEvent('gmp-auth-failed'));
      }
    } catch {}
    event.stopImmediatePropagation();
    event.preventDefault();
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  const reason = String(event?.reason?.message || event?.reason || '');
  if (
    reason.includes('WebSocket') ||
    reason.includes('websocket') ||
    reason.includes('Google Maps') ||
    reason.includes('InvalidKeyMapError') ||
    reason.includes('OverQuotaMapError') ||
    reason.includes('maps.googleapis')
  ) {
    try {
      if (reason.includes('OverQuotaMapError')) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      } else {
        window.dispatchEvent(new CustomEvent('gmp-auth-failed'));
      }
    } catch {}
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(<App />);

