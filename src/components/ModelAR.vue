<script setup>
// NOTE: <model-viewer> is loaded from CDN in index.html, NOT from npm.
// MindAR 1.2.5 needs Three ~0.160 (it uses sRGBEncoding), while
// model-viewer 3.5 needs a much newer Three (NeutralToneMapping).
// Bundling both from npm makes Vite resolve one Three for both and
// the build fails. Loading model-viewer from CDN keeps its Three
// bundled inside itself, separate from MindAR's.
defineEmits(['back'])
</script>

<template>
  <div>
    <p><button @click="$emit('back')">← Back</button></p>
    <h2>Markerless AR</h2>
    <p>On your phone, tap the AR button on the model to place it in your room. On desktop you can orbit and zoom it here.</p>
    <!-- Swap src / ios-src for your own .glb / .usdz to use your own model -->
    <model-viewer
      src="https://modelviewer.dev/shared-assets/models/Astronaut.glb"
      ios-src="https://modelviewer.dev/shared-assets/models/Astronaut.usdz"
      alt="A 3D astronaut model"
      ar
      ar-modes="webxr scene-viewer quick-look"
      camera-controls
      auto-rotate
      shadow-intensity="1"
    ></model-viewer>
  </div>
</template>

<style scoped>
model-viewer { width: 100%; height: 70vh; background: #f2f2f2; border-radius: 12px; }
</style>
