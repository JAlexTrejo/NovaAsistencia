// vite.config.mjs
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tagger from '@dhiwise/component-tagger'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const ANALYZE = env.ANALYZE === '1'
  const SOURCE_MAPS = env.SOURCE_MAPS !== '0' // por defecto true

  // Visualizer opcional (solo si ANALYZE=1)
  let visualizerPlugin = []
  if (ANALYZE) {
    try {
      const { visualizer } = await import('rollup-plugin-visualizer')
      visualizerPlugin = [
        visualizer({
          filename: 'build/stats.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
          template: 'treemap',
        }),
      ]
    } catch {
      // si no está instalado, se omite
    }
  }

  return {
    appType: 'spa',
    base: '/',

    build: {
      outDir: 'build',
      chunkSizeWarningLimit: 3000, // subimos el límite (antes 2000)
      sourcemap: SOURCE_MAPS,
      reportCompressedSize: true,
      manifest: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) return 'vendor-react'
              if (id.includes('@tanstack/react-query')) return 'vendor-react-query'
              if (id.includes('react-router')) return 'vendor-router'
              if (id.includes('lucide')) return 'vendor-icons'
              if (id.includes('@supabase')) return 'vendor-supabase'
              if (id.includes('date-fns') || id.includes('dayjs')) return 'vendor-dates'
              if (id.includes('recharts')) return 'vendor-recharts'
              if (id.includes('xlsx')) return 'vendor-xlsx'
              if (id.includes('@radix-ui') || id.includes('shadcn')) return 'vendor-ui'
              if (id.includes('framer-motion')) return 'vendor-motion'
              if (id.includes('zod')) return 'vendor-zod'
              return 'vendor'
            }
          },
        },
      },
    },

    plugins: [
      react(),
      tagger(),
      ...visualizerPlugin,
    ],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        // Fuerza Recharts a CJS para evitar "Cannot access '_' before initialization"
        recharts: 'recharts/lib/index.js',
      },
    },

    optimizeDeps: {
      include: ['recharts'],
    },

    server: {
      port: 4028,
      host: '0.0.0.0',
      strictPort: false,   // si 4028 está ocupado, usa otro
      hmr: {
        protocol: 'ws',
        clientPort: 4028,
        overlay: true,
      },
      allowedHosts: ['.amazonaws.com'],
    },

    preview: {
      port: 5028,
      host: true,
      strictPort: false,   // evita el error y cae al siguiente puerto libre
    },
  }
})
