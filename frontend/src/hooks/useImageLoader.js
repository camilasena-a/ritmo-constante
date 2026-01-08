import { useState, useEffect, useRef } from 'react';

/**
 * Hook para gerenciar o carregamento de imagens com lazy loading
 * @param {string} src - URL da imagem
 * @param {string} placeholder - URL da imagem placeholder (opcional)
 * @param {boolean} lazy - Se deve usar lazy loading (padrão: true)
 * @returns {object} - Estado do carregamento e refs
 */
export function useImageLoader(src, placeholder = null, lazy = true) {
  const [imageSrc, setImageSrc] = useState(placeholder || src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    // Se não for lazy loading, carregar imediatamente
    if (!lazy) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
        setHasError(false);
      };
      img.onerror = () => {
        setHasError(true);
        setIsLoaded(false);
      };
      img.src = src;
      return;
    }

    // Verificar se Intersection Observer está disponível
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback para navegadores antigos - carregar imediatamente
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
        setHasError(false);
      };
      img.onerror = () => {
        setHasError(true);
        setIsLoaded(false);
      };
      img.src = src;
      return;
    }

    // Lazy loading com Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.onload = () => {
              setImageSrc(src);
              setIsLoaded(true);
              setHasError(false);
            };
            img.onerror = () => {
              setHasError(true);
              setIsLoaded(false);
            };
            img.src = src;
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Começar a carregar 50px antes da imagem entrar na viewport
      }
    );

    const currentRef = imgRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [src, lazy]);

  return {
    imageSrc,
    isLoaded,
    hasError,
    imgRef,
  };
}

