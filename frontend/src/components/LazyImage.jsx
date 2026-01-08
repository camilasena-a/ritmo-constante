import { useState, useEffect } from 'react';
import { useImageLoader } from '../hooks/useImageLoader';

/**
 * Componente de imagem otimizado com lazy loading e suporte a formatos modernos
 * 
 * @param {string} src - URL da imagem principal
 * @param {string} srcSet - URLs de imagens em diferentes tamanhos (opcional)
 * @param {string} webpSrc - URL da imagem em formato WebP (opcional)
 * @param {string} avifSrc - URL da imagem em formato AVIF (opcional)
 * @param {string} alt - Texto alternativo (obrigatório para acessibilidade)
 * @param {string} placeholder - URL da imagem placeholder enquanto carrega
 * @param {boolean} lazy - Se deve usar lazy loading (padrão: true)
 * @param {string} className - Classes CSS adicionais
 * @param {object} ...props - Outras props do elemento img
 */
export default function LazyImage({
  src,
  srcSet,
  webpSrc,
  avifSrc,
  alt,
  placeholder,
  lazy = true,
  className = '',
  ...props
}) {
  const [imageError, setImageError] = useState(false);
  const [supportsWebP, setSupportsWebP] = useState(false);
  const [supportsAVIF, setSupportsAVIF] = useState(false);
  const { imageSrc, isLoaded, hasError, imgRef } = useImageLoader(
    src,
    placeholder,
    lazy
  );

  // Detectar suporte a formatos modernos
  useEffect(() => {
    const checkWebP = () => {
      const canvas = document.createElement('canvas');
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    };

    const checkAVIF = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.fillRect(0, 0, 1, 1);
      
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
      });
    };

    setSupportsWebP(checkWebP());
    checkAVIF().then(setSupportsAVIF);
  }, []);

  // Se houver erro no carregamento, mostrar placeholder ou imagem de erro
  const displaySrc = hasError || imageError ? placeholder || src : imageSrc;

  // Determinar qual formato usar
  const getBestFormat = () => {
    if (avifSrc && supportsAVIF) return 'avif';
    if (webpSrc && supportsWebP) return 'webp';
    return 'fallback';
  };

  const format = getBestFormat();
  const finalSrc = format === 'avif' ? avifSrc : format === 'webp' ? webpSrc : displaySrc;

  return (
    <div className="relative inline-block">
      {/* Placeholder enquanto carrega */}
      {!isLoaded && placeholder && (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover blur-sm ${className}`}
          style={{ opacity: 0.5 }}
        />
      )}
      <picture>
        {/* AVIF - melhor compressão */}
        {avifSrc && supportsAVIF && (
          <source srcSet={avifSrc} type="image/avif" />
        )}
        {/* WebP - boa compressão e amplo suporte */}
        {webpSrc && supportsWebP && (
          <source srcSet={webpSrc} type="image/webp" />
        )}
        {/* Imagem padrão */}
        <img
          ref={imgRef}
          src={finalSrc}
          srcSet={srcSet}
          alt={alt || ''}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          style={{ position: 'relative' }}
          onError={() => setImageError(true)}
          onLoad={() => {
            // Garantir que a imagem seja exibida após o carregamento
            if (imgRef.current) {
              imgRef.current.style.opacity = '1';
            }
          }}
          {...props}
        />
      </picture>
    </div>
  );
}

