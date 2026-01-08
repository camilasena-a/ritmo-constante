/**
 * EXEMPLO DE USO DO COMPONENTE LazyImage
 * 
 * Este arquivo demonstra como usar o componente LazyImage
 * para carregar imagens otimizadas com lazy loading.
 */

import LazyImage from './LazyImage';

// Exemplo 1: Uso básico com lazy loading
function ExampleBasic() {
  return (
    <LazyImage
      src="/assets/images/example.jpg"
      alt="Exemplo de imagem"
      className="w-full h-auto rounded-lg"
    />
  );
}

// Exemplo 2: Com formatos otimizados (WebP e AVIF)
function ExampleOptimized() {
  return (
    <LazyImage
      src="/assets/images/hero.jpg"
      webpSrc="/assets/images/hero.webp"
      avifSrc="/assets/images/hero.avif"
      alt="Imagem hero otimizada"
      placeholder="/assets/images/placeholder.jpg"
      className="w-full h-screen object-cover"
    />
  );
}

// Exemplo 3: Imagem acima da dobra (sem lazy loading)
function ExampleAboveFold() {
  return (
    <LazyImage
      src="/assets/images/logo.png"
      alt="Logo da aplicação"
      lazy={false}
      className="h-12 w-auto"
    />
  );
}

// Exemplo 4: Com srcSet para imagens responsivas
function ExampleResponsive() {
  return (
    <LazyImage
      src="/assets/images/banner.jpg"
      srcSet="/assets/images/banner-small.jpg 480w, /assets/images/banner-medium.jpg 768w, /assets/images/banner-large.jpg 1200w"
      webpSrc="/assets/images/banner.webp"
      alt="Banner responsivo"
      className="w-full h-auto"
    />
  );
}

// Exemplo 5: Usando importação com vite-imagetools
function ExampleWithImagetools() {
  // Importação otimizada durante o build
  const optimizedImage = new URL('/assets/images/photo.jpg?w=800&format=webp&quality=85', import.meta.url).href;
  const optimizedImageAvif = new URL('/assets/images/photo.jpg?w=800&format=avif&quality=85', import.meta.url).href;
  
  return (
    <LazyImage
      src="/assets/images/photo.jpg"
      webpSrc={optimizedImage}
      avifSrc={optimizedImageAvif}
      alt="Foto otimizada"
      className="w-full rounded-lg shadow-lg"
    />
  );
}

export {
  ExampleBasic,
  ExampleOptimized,
  ExampleAboveFold,
  ExampleResponsive,
  ExampleWithImagetools,
};

