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
      server.middlewares.use('/__bizyu_export', (req, res) => {
        const bizyuDir = path.join(os.homedir(), '.bizyu');
        const filePath = path.join(bizyuDir, 'tree_data.json');

        // GET: MCP が書き込んだ tree_data.json の現在内容をブラウザへ返す（起動時優先読み込み用）
        if (req.method === 'GET') {
          try {
            if (!fs.existsSync(filePath)) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(null));
              return;
            }
            const raw = fs.readFileSync(filePath, 'utf-8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(raw);
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'error', message: err.message }));
          }
          return;
        }

        // POST: ブラウザの nodes をファイルへ書き出す（既存のエクスポート処理）
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
            if (!fs.existsSync(bizyuDir)) {
              fs.mkdirSync(bizyuDir, { recursive: true });
            }
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
