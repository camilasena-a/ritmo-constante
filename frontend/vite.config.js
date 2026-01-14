import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base path para GitHub Pages (será substituído pelo nome do repositório)
// Em desenvolvimento, usa '/' (raiz)
// Em produção no GitHub Pages, usa '/nome-do-repositorio/'
const base = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  plugins: [react()],
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

