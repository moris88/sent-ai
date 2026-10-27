import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './styles/index.css';

// Anthropic non è più supportato: riporta le impostazioni salvate su Gemini
// e rimuove chiave e modello, che non sarebbero validi per il nuovo provider.
if (localStorage.getItem('sentai_provider') === 'anthropic') {
  localStorage.setItem('sentai_provider', 'gemini');
  localStorage.removeItem('sentai_api_key');
  localStorage.removeItem('sentai_model');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
