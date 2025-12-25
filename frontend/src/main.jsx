import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import errorLogger from './services/errorLogger';
import './index.css';

// Inicializar logging de erros antes de renderizar a aplicação
// O errorLogger já configura handlers globais automaticamente

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Log de inicialização bem-sucedida
errorLogger.addBreadcrumb('Aplicação inicializada', 'app', {
  timestamp: new Date().toISOString(),
});





