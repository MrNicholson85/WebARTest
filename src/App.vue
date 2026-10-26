<script setup>
import { defineAsyncComponent, ref } from 'vue'
import MarkerAR from './components/MarkerAR.vue'
import ModelAR from './components/ModelAR.vue'
// Lazy-loaded: MindAR + TensorFlow is ~2MB, so it only downloads
// when the user actually opens an AR tab that needs it.
const ImageTracking = defineAsyncComponent(() => import('./components/ImageTracking.vue'))
const TargetCompiler = defineAsyncComponent(() => import('./components/TargetCompiler.vue'))

// v-if (not v-show) matters for AR: unmounting an AR component
// destroys its scene and releases the camera when you leave that tab.
const view = ref('home')
</script>

<template>
  <main>
    <nav>
      <button :class="{ active: view === 'home' }" @click="view = 'home'">Home</button>
      <button :class="{ active: view === 'marker' }" @click="view = 'marker'">🏀 Marker AR</button>
      <button :class="{ active: view === 'model' }" @click="view = 'model'">📦 Markerless AR</button>
      <button :class="{ active: view === 'image' }" @click="view = 'image'">🖼️ Image Tracking</button>
      <button :class="{ active: view === 'compile' }" @click="view = 'compile'">🛠️ Compile Target</button>
    </nav>

    <section v-if="view === 'home'">
      <h1>Web AR — Vue version</h1>
      <p>Three demos plus a target compiler, as Vue 3 components. Vercel hosts the built <code>dist/</code> folder — still HTTPS, still needs a phone camera for real AR.</p>
      <p><button @click="view = 'marker'">Try Marker AR</button>
         <button @click="view = 'model'">Try Markerless AR</button>
         <button @click="view = 'image'">Try Image Tracking</button>
         <button @click="view = 'compile'">Compile my own target</button></p>
      <p class="note">Deploy: <code>npm run build</code>, then Vercel with Framework = Vite, Build Command = <code>npm run build</code>, Output = <code>dist</code>. Or just run <code>npx vercel</code> — it auto-detects Vite.</p>
    </section>

    <MarkerAR v-if="view === 'marker'" @back="view = 'home'" />
    <ModelAR v-if="view === 'model'" @back="view = 'home'" />
    <ImageTracking v-if="view === 'image'" @back="view = 'home'" />
    <TargetCompiler v-if="view === 'compile'" @back="view = 'home'" />
  </main>
</template>

<style>
body { margin: 0; font-family: system-ui, sans-serif; color: #111; }
main { max-width: 720px; margin: 0 auto; padding: 1rem; line-height: 1.6; }
nav { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
button { padding: 0.5rem 0.9rem; border: 1px solid #ddd; border-radius: 999px; background: #fff; cursor: pointer; }
button.active { background: #111; color: #fff; border-color: #111; }
code { background: #f2f2f2; padding: 0.15rem 0.4rem; border-radius: 6px; }
.note { background: #fff8e1; border: 1px solid #ffe08a; border-radius: 10px; padding: 0.75rem 1rem; }
</style>
