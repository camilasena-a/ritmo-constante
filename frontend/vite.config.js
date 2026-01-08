import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor chunks para melhor cache
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Separar bibliotecas de gráficos (Chart.js pode ser pesado)
          'charts-vendor': ['chart.js', 'react-chartjs-2'],
          // Separar bibliotecas de estado
          'state-vendor': ['zustand'],
          // Separar bibliotecas de utilitários
          'utils-vendor': ['axios', 'date-fns'],
        },
        // Nomes de chunks mais legíveis
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Otimizações de build
    chunkSizeWarningLimit: 1000, // Avisar se chunks forem maiores que 1MB
    sourcemap: false, // Desabilitar sourcemaps em produção para reduzir tamanho
  },
});

