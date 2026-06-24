import { loadEnv, defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const apiProxyTarget = process.env.API_PROXY_TARGET || env.VITE_API_BASE_URL || 'http://localhost:7860'

  return {
    server: {
      host: '0.0.0.0',
      port: 8090,
      https: false,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        }
      },
    },
    plugins: [
      vue(),
      AutoImport({ resolvers: [ElementPlusResolver()] }),
      Components({ resolvers: [ElementPlusResolver()] }),
    ],
  }
})
