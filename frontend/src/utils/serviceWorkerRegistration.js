/**
 * Utilitário para registro do Service Worker
 */

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

export function register(config) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // O service worker está na raiz do public, então a URL é simplesmente /sw.js
      const swUrl = '/sw.js';

      if (isLocalhost) {
        // Em localhost, verifica se o service worker ainda existe
        checkValidServiceWorker(swUrl, config);
        
        // Log adicional para desenvolvedores
        navigator.serviceWorker.ready.then(() => {
          console.log(
            '[Service Worker] Service worker registrado com sucesso em localhost.'
          );
        });
      } else {
        // Em produção, registra normalmente
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Novo conteúdo disponível
              console.log(
                '[Service Worker] Novo conteúdo disponível; recarregue a página.'
              );
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // Conteúdo em cache para uso offline
              console.log(
                '[Service Worker] Conteúdo em cache para uso offline.'
              );
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('[Service Worker] Erro durante o registro:', error);
      if (config && config.onError) {
        config.onError(error);
      }
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log(
        '[Service Worker] Sem conexão com a internet. App rodando em modo offline.'
      );
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

