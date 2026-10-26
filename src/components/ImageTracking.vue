<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js'

defineEmits(['back'])

// Sample target from MindAR's own docs (1.2.5). Print it, or show it
// on a second screen — see the link below.
// To use your own image permanently, compile it (Compile tab),
// put the .mind file in public/, and change IMAGE_TARGET_SRC to '/your-target.mind'.
// To test a just-compiled file without redeploying, use the picker in
// the "Change target" panel below.
const IMAGE_TARGET_SRC =
  '/ImageMarketTest.mind' // 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind'
const CARD_IMAGE_URL =
  'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.png'

const containerRef = ref(null)
const status = ref('Starting camera…')
const error = ref('')
const activeTarget = ref('Sample card')
const customMindUrl = ref('')
const showTargetPanel = ref(false)

let mindarThree = null
let cancelled = false
let startToken = 0
let previousBodyOverflow = ''

async function stopTracking() {
  if (mindarThree) {
    try {
      mindarThree.renderer?.setAnimationLoop(null)
      await mindarThree.stop()
    } catch {
      // Stop is best-effort; the camera is released by stop().
    }
    mindarThree = null
  }
  if (containerRef.value) containerRef.value.innerHTML = ''
}

async function startTracking(imageTargetSrc, label) {
  const token = ++startToken
  await stopTracking()
  if (cancelled || token !== startToken) return
  error.value = ''
  status.value = 'Starting camera…'
  activeTarget.value = label
  try {
    // MindAR Three is used here deliberately, NOT MindAR A-Frame:
    // the existing marker tab uses AR.js on A-Frame 1.5, and MindAR
    // A-Frame wants A-Frame 1.6. Mixing two A-Frame AR systems on
    // one global A-Frame would fight. MindAR Three is self-contained.
    mindarThree = new MindARThree({
      container: containerRef.value,
      imageTargetSrc,
    })
    const { renderer, scene, camera } = mindarThree

    const anchor = mindarThree.addAnchor(0)
    anchor.onTargetFound = () => { status.value = 'Target found — basketball locked on' }
    anchor.onTargetLost = () => { status.value = `Scanning for: ${label}…` }

    // Lights: MindAR's scene does not add any by default.
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2))
    const dir = new THREE.DirectionalLight(0xffffff, 1.0)
    dir.position.set(0, 0, 2)
    anchor.group.add(dir)

    // Content sits on the image plane: the card is in XY, +Z points
    // out of the card toward the viewer. So "above the card" is +Z,
    // not +Y — a common MindAR Three gotcha.
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xff6b1a, roughness: 0.7 }),
    )
    ball.position.set(-0.15, 0, 0.18)
    anchor.group.add(ball)

    const backboard = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.28, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xffffff }),
    )
    backboard.position.set(0.28, 0.05, 0.05)
    anchor.group.add(backboard)

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.015, 12, 32),
      new THREE.MeshStandardMaterial({ color: 0xff3b30 }),
    )
    rim.position.set(0.28, 0.05, 0.22)
    anchor.group.add(rim)

    await mindarThree.start()
    if (cancelled || token !== startToken) {
      await stopTracking()
      return
    }
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera)
    })
    status.value = `Scanning for: ${label}…`
  } catch (e) {
    if (!cancelled && token === startToken) {
      error.value = e?.message || String(e)
      status.value = 'Could not start image tracking'
    }
  }
}

function onMindFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (customMindUrl.value) URL.revokeObjectURL(customMindUrl.value)
  customMindUrl.value = URL.createObjectURL(file)
  showTargetPanel.value = false
  startTracking(customMindUrl.value, file.name)
}

function useSample() {
  showTargetPanel.value = false
  startTracking(IMAGE_TARGET_SRC, 'Sample card')
}

onMounted(() => {
  // Fullscreen: stop the page behind from scrolling while AR is open.
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  startTracking(IMAGE_TARGET_SRC, 'Sample card')
})

onUnmounted(async () => {
  cancelled = true
  startToken++
  await stopTracking()
  if (customMindUrl.value) URL.revokeObjectURL(customMindUrl.value)
  document.body.style.overflow = previousBodyOverflow
})
</script>

<template>
  <!-- Fullscreen AR, like the Marker tab: the video fills the viewport,
       it is no longer a 70vh box at the bottom of a scrolling page.
       The Back button below is overlaid on the video and, because App.vue
       mounts this with v-if, tapping it unmounts this component, which
       stops MindAR and releases the camera. -->
  <div class="fullscreen-ar">
    <div ref="containerRef" class="ar-container"></div>

    <div class="overlay-top">
      <button class="back-button" @click="$emit('back')">← Back</button>
      <div class="overlay-status">
        <div class="status" :class="{ error: error }">{{ error || status }}</div>
        <div class="target-name">Tracking: {{ activeTarget }}</div>
      </div>
    </div>

    <div v-if="error" class="error-hint">
      Most common cause: camera permission denied, or opening over http instead
      of the Vercel https URL. Allow the camera and reload.
    </div>

    <div class="overlay-bottom">
      <button class="target-button" @click="showTargetPanel = !showTargetPanel">
        {{ showTargetPanel ? 'Hide target options' : 'Change target' }}
      </button>
      <div v-if="showTargetPanel" class="target-panel">
        <p>
          Point your phone at the sample card — print it, or show it on
          a laptop/tablet screen:
        </p>
        <p>
          <a :href="CARD_IMAGE_URL" target="_blank" rel="noopener">
            <img :src="CARD_IMAGE_URL" alt="MindAR sample card target" class="target-preview" />
          </a>
        </p>
        <p>
          <strong>Test your own compiled target without redeploying:</strong>
          compile it in the Compile tab, then pick the <code>.mind</code> file here.
          <input type="file" accept=".mind" @change="onMindFileChange" />
        </p>
        <p><button @click="useSample">Back to sample card</button></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fullscreen-ar {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: #000;
  color: #fff;
}

.ar-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #000;
}

.ar-container :deep(canvas),
.ar-container :deep(video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
}

.overlay-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 12px;
  padding-top: max(12px, env(safe-area-inset-top));
  background: linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0));
  pointer-events: none;
}

.back-button,
.target-button {
  pointer-events: auto;
  padding: 0.6rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
}

.overlay-status {
  flex: 1;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
}

.status {
  font-weight: 600;
}

.status.error {
  color: #ff8a80;
}

.target-name {
  font-size: 0.9rem;
  opacity: 0.9;
}

.error-hint {
  position: absolute;
  top: 76px;
  left: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  padding: 0.75rem 1rem;
}

.overlay-bottom {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  pointer-events: none;
}

.target-panel {
  pointer-events: auto;
  width: 100%;
  max-height: 55vh;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  box-sizing: border-box;
}

.target-panel a {
  color: #ffd166;
}

.target-preview {
  width: 180px;
  max-width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
}
</style>
