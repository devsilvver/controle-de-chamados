import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Captura a data e hora atual do build (Fuso horário de Brasília)
    const buildDate = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    return {
      // Define a variável global disponível no código React
      define: {
        '__BUILD_DATE__': JSON.stringify(buildDate),
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // (Opcional) Garante que o plugin do React esteja ativo caso não estivesse
      plugins: [react()]
    };
});