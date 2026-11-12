import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    server: { port: 5173, strictPort: true, proxy: { '/api': env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3001' } },
    test: { environment: 'jsdom', restoreMocks: true }
  };
});
