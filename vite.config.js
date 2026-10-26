import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// The key Vue + AR bit: tell Vue NOT to treat A-Frame / model-viewer
// tags as Vue components. They are web components / custom elements.
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('a-') || tag === 'model-viewer',
        },
      },
    }),
  ],
})
