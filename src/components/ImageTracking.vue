<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js'

defineEmits(['back'])

// Sample target from MindAR's own docs (1.2.5). Print it, or show it
// on a second screen — see the link below.
// To use your own image permanently, compile it (Compile tab),
// put the .mind file in public/, and change IMAGE_TARGET_SRC to '/your-target.mind'.
// To test a just-compiled file without redeploying, use the picker below.
const IMAGE_TARGET_SRC =
  'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind'
const CARD_IMAGE_URL =
  'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.png'

const containerRef = ref(null)
const status = ref('Starting camera…')
const error = ref('')
const activeTarget = ref('Sample card')
const customMindUrl = ref('')

let mindarThree = null
let cancelled = false
let startToken = 0

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
  startTracking(customMindUrl.value, file.name)
}

function useSample() {
  startTracking(IMAGE_TARGET_SRC, 'Sample card')
}

onMounted(() => startTracking(IMAGE_TARGET_SRC, 'Sample card'))

onUnmounted(async () => {
  cancelled = true
  startToken++
  await stopTracking()
  if (customMindUrl.value) URL.revokeObjectURL(customMindUrl.value)
})
</script>

<template>
  <div>
    <p><button @click="$emit('back')">← Back</button></p>
    <h2>Image Tracking</h2>
    <p>
      This is different from the Hiro marker tab: instead of a black-and-white
      marker, it tracks a real picture. Point your phone at this card image —
      print it, or show it on a laptop/tablet screen:
    </p>
    <p>
      <a :href="CARD_IMAGE_URL" target="_blank" rel="noopener">
        <img :src="CARD_IMAGE_URL" alt="MindAR sample card target" class="target-preview" />
      </a>
    </p>
    <p class="hint">
      <strong>Test your own compiled target without redeploying:</strong>
      compile it in the Compile tab, then pick the <code>.mind</code> file here.
      <input type="file" accept=".mind" @change="onMindFileChange" />
      <button @click="useSample">Back to sample card</button>
    </p>
    <p>Currently tracking: <strong>{{ activeTarget }}</strong></p>
    <p class="status" :class="{ error: error }">{{ error || status }}</p>
    <p v-if="error" class="hint">
      Most common cause: camera permission denied, or opening over http instead
      of the Vercel https URL. Allow the camera and reload.
    </p>
    <div ref="containerRef" class="ar-container"></div>
  </div>
</template>

<style scoped>
.target-preview { width: 220px; max-width: 100%; border: 1px solid #ddd; border-radius: 8px; }
.status { font-weight: 600; }
.status.error { color: #b00020; }
.hint { background: #fff8e1; border: 1px solid #ffe08a; border-radius: 10px; padding: 0.75rem 1rem; }
.ar-container { position: relative; width: 100%; height: 70vh; overflow: hidden; border-radius: 12px; background: #000; }
.ar-container :deep(canvas), .ar-container :deep(video) { width: 100% !important; height: 100% !important; object-fit: cover; }
</style>
