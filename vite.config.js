import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    server: {
      port: 3000,
      allowedHosts: ['www.dosport.online', 'dosport.online'],
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8080',
          changeOrigin: true
        },
        '/cos-proxy': {
          target: 'https://gym-1407507629.cos.ap-chengdu.myqcloud.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/cos-proxy/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              // 移除 referer 避免 COS 安全策略拦截
              proxyReq.removeHeader('referer')
            })
          }
        }
      }
    }
  }
})
