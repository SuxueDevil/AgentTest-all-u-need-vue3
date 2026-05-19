/**
 * Vite 构建配置 — Agent 智能评测平台
 *
 * 本文件配置 Vite 构建工具的各项行为，包括：
 * - Vue SFC 编译
 * - 路径别名（13 个 @ 前缀别名，与 tsconfig paths 保持一致）
 * - 开发服务器（端口、监听地址、API 代理）
 * - 生产构建分包策略（vendor chunk 拆分）
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  // =========================================================================
  // 插件
  // =========================================================================
  plugins: [
    // @vitejs/plugin-vue: 让 Vite 能够编译 .vue 单文件组件（SFC）
    // 支持 <script setup>、CSS Scoped、HMR 热更新等特性
    vue(),
  ],

  // =========================================================================
  // 路径别名
  // =========================================================================
  // 使用 fileURLToPath + import.meta.url 替代 __dirname，
  // 这是 ESM 模块规范下的标准做法，兼容所有平台路径格式。
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
      '@api': fileURLToPath(new URL('src/api', import.meta.url)),
      '@assets': fileURLToPath(new URL('src/assets', import.meta.url)),
      '@components': fileURLToPath(new URL('src/components', import.meta.url)),
      '@config': fileURLToPath(new URL('src/config', import.meta.url)),
      '@constants': fileURLToPath(new URL('src/constants', import.meta.url)),
      '@layouts': fileURLToPath(new URL('src/layouts', import.meta.url)),
      '@router': fileURLToPath(new URL('src/router', import.meta.url)),
      '@stores': fileURLToPath(new URL('src/stores', import.meta.url)),
      '@types': fileURLToPath(new URL('src/types', import.meta.url)),
      '@utils': fileURLToPath(new URL('src/utils', import.meta.url)),
      '@views': fileURLToPath(new URL('src/views', import.meta.url)),
    },
  },

  // =========================================================================
  // 开发服务器
  // =========================================================================
  server: {
    // 监听端口（默认 5173，Vite 标准端口）
    port: 5173,

    // 监听所有网络接口（0.0.0.0），允许局域网内其他设备访问
    // 开发时可通过本机 IP + 端口在手机或其他设备上预览
    host: '0.0.0.0',

    // API 代理：将 /api 前缀的请求转发到后端服务
    // 解决开发阶段前后端跨域问题，生产环境由 Nginx 处理
    proxy: {
      '/api': {
        // 后端 API 服务地址（Spring Boot / Express 等）
        target: 'http://localhost:8080',
        // 修改请求头 Origin 为目标地址，避免后端 CORS 校验
        changeOrigin: true,
      },
    },
  },

  // =========================================================================
  // 生产构建
  // =========================================================================
  build: {
    rollupOptions: {
      output: {
        // 手动分包策略：将稳定的第三方依赖拆分为独立 chunk
        // 好处：依赖不变时 chunk 哈希不变，浏览器可继续使用缓存，
        //       仅业务代码变更时只需重新下载业务 chunk
        manualChunks: {
          // Vue 生态核心库（vue + vue-router + pinia）→ vue-vendor.[hash].js
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // ECharts 图表库（体积较大，单独拆分）→ echarts-vendor.[hash].js
          'echarts-vendor': ['echarts'],
        },
      },
    },
  },
})
