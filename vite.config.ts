import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Gera a data/hora atual no fuso de Brasília para exibição e controle de versão
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
      define: {
        // Variável global acessível no React
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
      plugins: [
        react(),
        {
          name: 'generate-version-file',
          // Executa ao finalizar o bundle
          closeBundle() {
            const distPath = path.resolve(__dirname, 'dist');
            const versionFile = path.join(distPath, 'version.json');
            
            if (fs.existsSync(distPath)) {
              // Cria o arquivo que o site vai consultar para saber se mudou
              fs.writeFileSync(versionFile, JSON.stringify({ version: buildDate }));
              console.log(`✅ version.json gerado: ${buildDate}`);
            }
          }
        }
      ]
    };
});