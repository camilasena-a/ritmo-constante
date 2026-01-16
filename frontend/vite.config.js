import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'fs';
import { resolve } from 'path';

// Base path para GitHub Pages (será substituído pelo nome do repositório)
// Em desenvolvimento, usa '/' (raiz)
// Em produção no GitHub Pages, usa '/nome-do-repositorio/'
const base = process.env.VITE_BASE_PATH || '/';

// Plugin para copiar 404.html para a pasta dist após o build
const copy404Plugin = () => {
  return {
    name: 'copy-404',
    closeBundle() {
      const root = process.cwd();
      const src = resolve(root, '404.html');
      const dest = resolve(root, 'dist', '404.html');
      try {
        copyFileSync(src, dest);
        console.log('✅ 404.html copiado para dist/');
      } catch (error) {
        console.warn('⚠️ Não foi possível copiar 404.html:', error.message);
      }
    },
  };
};

export default defineConfig({
  plugins: [react(), copy404Plugin()],
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

