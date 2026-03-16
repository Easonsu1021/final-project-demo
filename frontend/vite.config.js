import { resolve } from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // For local development, use localhost addresses
  const designApiTarget = env.VITE_DESIGN_API_PROXY || 'http://localhost:8001'
  const predictionApiTarget = env.VITE_PREDICTION_API_PROXY || 'http://localhost:8002'
  return defineConfig({
    plugins: [react()],
    server: {
      proxy: {
        '/design/': { target: designApiTarget, changeOrigin: true },
        '/predict/': { target: predictionApiTarget, changeOrigin: true },
      },
    },
    build: {
      // Improve chunk loading performance
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          warpage: resolve(__dirname, 'pcb/warpage.html'),
          design: resolve(__dirname, 'pcb/design.html'),
          library: resolve(__dirname, 'pcb/library.html'),
        },
        output: {
          // Manual chunks for better caching
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-reactflow': ['reactflow'],
            'vendor-plotly': ['plotly.js-dist-min'],
            'vendor-three': ['three'],
            'vendor-lucide': ['lucide-react'],
          },
        },
      },
    },
    // Optimize dev server
    optimizeDeps: {
      include: ['react', 'react-dom', 'reactflow', 'lucide-react'],
    },
  })
}
