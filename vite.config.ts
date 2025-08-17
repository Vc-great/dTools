import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  
  build: {
    // 优化构建
    rollupOptions: {
      output: {
        // 手动分包
        manualChunks: {
          // React 相关
          react: ['react', 'react-dom'],
          // UI 库
          mantine: ['@mantine/core', '@mantine/hooks', '@mantine/modals', '@mantine/notifications'],
          // 编辑器 - 单独分包
          monaco: ['@monaco-editor/react'],
          // 路由
          router: ['react-router-dom'],
          // 工具库
          utils: ['dayjs', 'localforage', 'js-cookie', 'js-toml'],
          // Tauri API
          tauri: ['@tauri-apps/api'],
          // Tauri 插件
          'tauri-plugins': [
            '@tauri-apps/plugin-fs',
            '@tauri-apps/plugin-dialog',
            '@tauri-apps/plugin-shell',
            '@tauri-apps/plugin-os',
            '@tauri-apps/plugin-notification'
          ]
        }
      }
    },
    // 调整块大小警告限制
    chunkSizeWarningLimit: 800,
    // 优化
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },

  // 配置 Monaco Editor
  define: {
    // 为Monaco Editor定义全局变量
    global: 'globalThis',
  },

  optimizeDeps: {
    include: ['@monaco-editor/react'],
    exclude: ['monaco-editor']
  }
}))
