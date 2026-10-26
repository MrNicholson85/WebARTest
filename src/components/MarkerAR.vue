<script setup>
defineEmits(['back'])
</script>

<template>
  <div>
    <p><button @click="$emit('back')">← Back</button></p>
    <div class="hint">
      Point your camera at a
      <a href="https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png" target="_blank" rel="noopener">Hiro marker</a>.
      Allow camera access when asked.
    </div>
    <!-- Vue only renders these tags — A-Frame / AR.js does the AR work.
         Because vite.config.js marks a-* as custom elements, Vue
         passes attributes like arjs through untouched. -->
    <a-scene embedded arjs="sourceType: webcam; debugUIEnabled: false;">
      <a-marker preset="hiro">
        <a-sphere position="0 0.5 0" radius="0.5" color="#ff6b1a" roughness="0.8"></a-sphere>
        <a-torus position="0.9 1.4 0" radius="0.35" tube="0.04" color="#ff3b30" rotation="90 0 0"></a-torus>
        <a-box position="0.9 1.7 -0.25" width="0.9" height="0.7" depth="0.05" color="#ffffff" opacity="0.9"></a-box>
        <a-plane position="0 0.01 0" width="3" height="3" color="#1d3557" rotation="-90 0 0" opacity="0.85"></a-plane>
        <a-text value="BLACKTOP AR" position="-0.9 2.2 0" color="#ffffff" width="4"></a-text>
      </a-marker>
      <a-entity camera></a-entity>
    </a-scene>
  </div>
</template>

<style scoped>
.hint { background: rgba(0,0,0,0.7); color: #fff; padding: 10px 14px; border-radius: 10px; font-size: 14px; margin-bottom: 0.75rem; }
.hint a { color: #ffd166; }
a-scene { display: block; height: 70vh; }
</style>
