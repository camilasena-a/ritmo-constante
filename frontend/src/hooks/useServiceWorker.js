import { useState, useEffect } from 'react';

/**
 * Hook para monitorar o status do Service Worker
 * Útil para mostrar notificações de atualização ao usuário
 */
export function useServiceWorker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        // Verifica se há uma atualização disponível
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      });

      // Verifica status offline
      const handleOnline = () => {
        setOfflineReady(false);
      };
      const handleOffline = () => {
        setOfflineReady(true);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Verifica status inicial
      if (!navigator.onLine) {
        setOfflineReady(true);
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const updateServiceWorker = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return {
    updateAvailable,
    offlineReady,
    updateServiceWorker,
    isSupported: 'serviceWorker' in navigator,
  };
}

