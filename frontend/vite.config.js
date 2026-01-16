import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync, copyFileSync } from 'fs';
import { join } from 'path';

// Base path para GitHub Pages (será substituído pelo nome do repositório)
// Em desenvolvimento, usa '/' (raiz)
// Em produção no GitHub Pages, usa '/nome-do-repositorio/'
const base = process.env.VITE_BASE_PATH || '/';

// Plugin para criar arquivo .nojekyll e copiar 404.html no build (necessário para GitHub Pages)
const githubPagesPlugin = () => {
  return {
    name: 'github-pages',
    closeBundle() {
      const distPath = join(process.cwd(), 'dist');
      const rootPath = process.cwd();
      
      // Criar arquivo .nojekyll para desabilitar Jekyll
      writeFileSync(join(distPath, '.nojekyll'), '');
      
      // Copiar 404.html para dist (necessário para GitHub Pages SPA routing)
      const source404 = join(rootPath, '404.html');
      const dest404 = join(distPath, '404.html');
      try {
        copyFileSync(source404, dest404);
      } catch (err) {
        console.warn('Arquivo 404.html não encontrado, pulando cópia');
      }
    },
  };
};

export default defineConfig({
  plugins: [react(), githubPagesPlugin()],
  base,
  server: {
    port: 5173,
    host: '0.0.0.0', // Permite acesso de qualquer interface
    open: true, // Abre o navegador automaticamente
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Garante que o service worker seja incluído no build
    rollupOptions: {
      output: {
        // Mantém a estrutura de arquivos para o service worker
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  // Configuração para servir o service worker corretamente
  publicDir: 'public',
});

