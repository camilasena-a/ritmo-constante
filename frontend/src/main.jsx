import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import * as serviceWorkerRegistration from './utils/serviceWorkerRegistration';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Registra o service worker para PWA
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    // Quando há uma atualização disponível
    console.log('[Service Worker] Nova versão disponível');
    // Opcional: mostrar notificação para o usuário atualizar
    if (window.confirm('Nova versão disponível! Deseja atualizar agora?')) {
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  },
  onSuccess: () => {
    console.log('[Service Worker] Registrado com sucesso');
  },
  onError: (error) => {
    console.error('[Service Worker] Erro no registro:', error);
  },
});





