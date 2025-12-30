import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import errorLogger from './services/errorLogger';
import './index.css';

// Inicializar logging de erros antes de renderizar a aplicação
// O errorLogger já configura handlers globais automaticamente

// Configurar QueryClient para cache de dados
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos - dados considerados frescos
      cacheTime: 10 * 60 * 1000, // 10 minutos - tempo que dados ficam em cache
      refetchOnWindowFocus: false, // Não refazer fetch ao focar na janela
      retry: 1, // Tentar apenas 1 vez em caso de erro
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

// Log de inicialização bem-sucedida
errorLogger.addBreadcrumb('Aplicação inicializada', 'app', {
  timestamp: new Date().toISOString(),
});





