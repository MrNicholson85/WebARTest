<script setup>
import { ref} from 'vue'
// Compiler is exported from mind-ar's image bundle (verified in
// node_modules/mind-ar/dist/mindar-image.prod.js). It runs entirely
// in the browser — your image is never uploaded anywhere.
import { Compiler} from 'mind-ar/dist/mindar-image.prod.js'

defineEmits(['back'])

const fileInput = ref(null)
const fileName = ref('')
const previewUrl = ref('')
const progress = ref(0)
const compiling = ref(false)
const status = ref('Choose an image to start.')
const error = ref('')
const downloadUrl = ref('')
const downloadName = ref('targets.mind')

function onFileChange(event) {
const file = event.target.files?.[0]
if (!file) return
error.value = ''
downloadUrl.value = ''
progress.value = 0
fileName.value = file.name
// Keep the.mind name tied to the image name, e.g. poster.png -> poster.mind
downloadName.value = file.name.replace(/\.[^.]+$/, '') + '.mind'
if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
previewUrl.value = URL.createObjectURL(file)
status.value = `Ready to compile: ${file.name}. Check the preview — the printed image must match this exactly.`
}

async function loadImage(url) {
const img = new Image()
img.src = url
await img.decode()
return img
}

async function compile() {
if (!previewUrl.value) {
error.value = 'Choose an image first.'
return
}
compiling.value = true
error.value = ''
downloadUrl.value = ''
progress.value = 0
status.value = 'Compiling… this extracts feature points and can take 10–60 seconds for a detailed image. Don’t close the tab.'
try {
const img = await loadImage(previewUrl.value)
const compiler = new Compiler()
await compiler.compileImageTargets([img], (p) => {
progress.value = Math.round(p)
})
const buffer = compiler.exportData()
const blob = new Blob([buffer], { type: 'application/octet-stream'})
if (downloadUrl.value) URL.revokeObjectURL(downloadUrl.value)
downloadUrl.value = URL.createObjectURL(blob)
progress.value = 100
status.value = 'Done — download your.mind file below, then follow the 3 steps underneath it.'
} catch (e) {
error.value = e?.message || String(e)
status.value = 'Compilation failed.'
} finally {
compiling.value = false
}
}
</script>

<template>
<div>
<p><button @click="$emit('back')">← Back</button></p>
<h2>Compile your own image target</h2>
<p>
This is MindAR's own compiler, running in your browser. Your image never
leaves this device. The official MindAR compiler works the same way —
compile first, because tracking needs the feature points extracted
beforehand, not at scan time.
</p>

<h3>1. Pick a good image</h3>
<ul>
<li><strong>Complex and detailed</strong> — lots of dots, lines, shapes and texture. More detail = more feature points.</li>
<li><strong>High contrast, not repetitive, not symmetrical</strong> — repeating patterns confuse matching, and symmetry makes orientation ambiguous.</li>
<li><strong>No large blank areas</strong> — a blank corner has no features to track.</li>
<li><strong>Use the exact file you will print/show.</strong> Cropping, filtering, or re-exporting after compiling breaks the match.</li>
</ul>
<p class="hint">Good examples: a detailed poster, a book cover, a busy photo. Poor examples: a plain logo on white, a QR code alone, a solid colour with one word on it.</p>

<h3>2. Choose and compile</h3>
<p>
<input ref="fileInput" type="file" accept="image/*" @change="onFileChange" />
</p>
<p v-if="previewUrl">
<img :src="previewUrl" alt="Target image preview" class="preview" />
<br />{{ fileName}}
</p>
<p>
<button :disabled="compiling ||!previewUrl" @click="compile">
{{ compiling? `Compiling… ${progress}%`: 'Compile to.mind'}}
</button>
</p>
<p v-if="compiling"><progress :value="progress" max="100"></progress> {{ progress}}%</p>
<p class="status" :class="{ error: error}">{{ error || status}}</p>

<div v-if="downloadUrl">
<h3>3. Download and use it</h3>
<p><a :href="downloadUrl" :download="downloadName">⬇ Download {{ downloadName}}</a></p>
<ol>
<li>Put that file in <code>web-ar-vue/public/</code> (create the folder if it isn't there).</li>
<li>In <code>src/components/ImageTracking.vue</code>, change <code>IMAGE_TARGET_SRC</code> to <code>'/{{ downloadName}}'</code>.</li>
<li>Redeploy to Vercel, then print/show the <em>same</em> image and open the Image Tracking tab.</li>
</ol>
<p class="hint">
Want to test without redeploying? In the Image Tracking tab there is now
also a “test a local.mind file” picker — choose the file you just
downloaded and it will track it immediately in this browser session.
</p>
<p>Prefer the official tool instead? It is the same compiler, hosted by MindAR: <a href="https://hiukim.github.io/mind-ar-js-doc/tools/compile" target="_blank" rel="noopener">MindAR Image Targets Compiler</a> — drop your image, click Start, then Download.</p>
</div>
</div>
</template>

<style scoped>
.preview { max-width: 100%; width: 320px; border: 1px solid #ddd; border-radius: 8px;}
.status { font-weight: 600;}
.status.error { color: #b00020;}
.hint { background: #fff8e1; border: 1px solid #ffe08a; border-radius: 10px; padding: 0.75rem 1rem;}
progress { width: 100%;}
</style>
