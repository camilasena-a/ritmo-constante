# Assets - Imagens e Recursos Estáticos

Esta pasta contém os recursos estáticos da aplicação, incluindo imagens otimizadas.

## Estrutura

```
assets/
├── images/          # Imagens da aplicação
│   ├── logos/       # Logos e marcas
│   ├── icons/       # Ícones customizados
│   └── backgrounds/ # Imagens de fundo
```

## Otimização de Imagens

O projeto utiliza `vite-imagetools` para otimização automática de imagens durante o build.

### Formatos Suportados

- **AVIF** - Melhor compressão (recomendado quando suportado)
- **WebP** - Boa compressão e amplo suporte
- **PNG/JPG** - Formatos tradicionais (fallback)

### Como Usar

#### 1. Importação Direta (Recomendado)

```jsx
import logo from '/assets/images/logos/logo.png?w=200&format=webp';
import logoAvif from '/assets/images/logos/logo.png?w=200&format=avif';

<LazyImage
  src="/assets/images/logos/logo.png"
  webpSrc={logo}
  avifSrc={logoAvif}
  alt="Logo Ritmo Constante"
/>
```

#### 2. Usando o Componente LazyImage

```jsx
import LazyImage from '../components/LazyImage';

// Uso básico
<LazyImage
  src="/assets/images/example.jpg"
  alt="Descrição da imagem"
  className="w-full h-auto rounded-lg"
/>

// Com formatos otimizados
<LazyImage
  src="/assets/images/example.jpg"
  webpSrc="/assets/images/example.webp"
  avifSrc="/assets/images/example.avif"
  alt="Descrição da imagem"
  placeholder="/assets/images/placeholder.jpg"
  className="w-full h-auto"
/>

// Com lazy loading desabilitado (para imagens acima da dobra)
<LazyImage
  src="/assets/images/hero.jpg"
  alt="Hero image"
  lazy={false}
  className="w-full"
/>
```

#### 3. Parâmetros do vite-imagetools

Ao importar imagens, você pode usar os seguintes parâmetros:

- `?w=800` - Largura em pixels
- `?h=600` - Altura em pixels
- `?format=webp` - Formato de saída (webp, avif, png, jpg)
- `?quality=80` - Qualidade (0-100)
- `?fit=cover` - Modo de ajuste (cover, contain, fill, inside, outside)

Exemplo:
```jsx
import optimizedImage from '/assets/images/photo.jpg?w=1200&format=webp&quality=85';
```

## Boas Práticas

1. **Sempre use o componente LazyImage** para imagens abaixo da dobra
2. **Forneça texto alternativo** (`alt`) para acessibilidade
3. **Use placeholders** para imagens grandes
4. **Otimize antes de adicionar** - Use ferramentas como TinyPNG ou Squoosh
5. **Prefira SVG** para ícones e logos simples
6. **Use formatos modernos** (WebP/AVIF) quando possível

## Tamanhos Recomendados

- **Hero images**: 1920x1080px (máximo)
- **Cards**: 800x600px
- **Thumbnails**: 400x300px
- **Avatares**: 200x200px
- **Ícones**: 64x64px ou SVG

## Compressão

As imagens são automaticamente comprimidas durante o build. Para compressão manual antes do commit:

1. Use [Squoosh](https://squoosh.app/) ou [TinyPNG](https://tinypng.com/)
2. Mantenha qualidade entre 80-90% para fotos
3. Use qualidade 100% apenas para imagens com texto

