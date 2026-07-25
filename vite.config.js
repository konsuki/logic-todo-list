import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'

// https://vitejs.dev/config/
// Custom Vite plugin: exports tree data to filesystem for MCP server consumption
function bizyuExportPlugin() {
  return {
    name: 'bizyu-export',
    configureServer(server) {
      server.middlewares.use('/__bizyu_export', (req, res, next) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'error', message: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const bizyuDir = path.join(os.homedir(), '.bizyu');
            if (!fs.existsSync(bizyuDir)) {
              fs.mkdirSync(bizyuDir, { recursive: true });
            }
            const filePath = path.join(bizyuDir, 'tree_data.json');
            fs.writeFileSync(filePath, body, 'utf-8');

            res.statusCode = 201;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'ok', path: filePath }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'error', message: err.message }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), bizyuExportPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js'
  }
})
