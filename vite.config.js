import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: [{ find: "v-qr-code-next", replacement: "/src/qrcode/index.js" }],
  },
  build: {
    lib: {
      entry: resolve(dirname(fileURLToPath(import.meta.url)), './src/qrcode/index.js'),
      name: 'VQrCodeNext',
      fileName: (format) => `v-qr-code-next.${format}.js`,
    }
  }
})
