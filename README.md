# Web AR — Vue 3 + Vite version

Vue works for this. This is the same starter as `../web-ar/`, rebuilt as Vue components so your UI (tabs, buttons, state) is Vue, while the AR itself stays in the libraries that do it best:

- **Marker AR:** A-Frame + AR.js, loaded from CDN in `index.html`. Vue just renders the `<a-scene>` tags.
- **Markerless AR:** `<model-viewer>` from CDN in `index.html` (see the version note below). Vue just renders the tag.
- **Image Tracking:** MindAR + Three.js in `src/components/ImageTracking.vue`. Vue owns the container and the start/stop lifecycle; MindAR owns tracking.

## Why this split?

A-Frame and model-viewer are custom elements, not Vue components. Trying to make them reactive Vue components fights them. The pattern that works is:

1. Vue owns the page state and navigation.
2. The AR libraries own the scene inside one component.
3. `vite.config.js` tells Vue to leave `a-*` and `model-viewer` tags alone (`isCustomElement`).
4. Use `v-if`, not `v-show`, for AR views — unmounting them releases the phone camera. ImageTracking also stops MindAR explicitly in `onUnmounted`.

## Image tracking — how it works

- Sample target: MindAR's own card example. The component shows the card image — print it, or show it on a second screen — and a basketball + hoop appear on top of it when it's recognised.
- It uses MindAR Three, not MindAR A-Frame, on purpose: the marker tab already uses AR.js on A-Frame 1.5, and MindAR A-Frame wants A-Frame 1.6. Mixing two A-Frame AR systems on one global A-Frame would fight.
- In MindAR Three, the image plane is XY and +Z points out of the card. "Above the card" is +Z, not +Y.
- The component is lazy-loaded (`defineAsyncComponent` in `App.vue`), so MindAR's ~2.5 MB chunk only downloads when you open that tab.

## Use your own image as a target

Two ways, same compiler underneath:

**A. In this app — Compile tab (recommended)**
1. Open the Compile tab, choose your image. It runs MindAR's `Compiler` entirely in your browser — the image never leaves your device.
2. Click Compile, wait for 100% (10–60 seconds for a detailed image), download the `.mind` file.
3. To test immediately, without redeploying: go to the Image Tracking tab and use the “test a local .mind file” picker with the file you just downloaded.
4. To make it permanent: put the file in `public/` (e.g. `public/my-poster.mind` — Vite serves `public/` at the site root), change `IMAGE_TARGET_SRC` in `src/components/ImageTracking.vue` to `'/my-poster.mind'`, and redeploy.

**B. Official MindAR compiler**
https://hiukim.github.io/mind-ar-js-doc/tools/compile — drop your image, click Start, then Download. Then follow steps 3–4 above.

**Picking a good image:** high contrast, lots of detail, not too repetitive, not mostly blank. A poster, a card, or a book cover works; a plain logo on white usually doesn't. The printed/shown image must match the compiled image exactly — no cropping, filtering, or re-exporting after compiling.

## Run it

```bash
cd web-ar-vue
npm install --ignore-scripts
npm run dev
```

`--ignore-scripts` matters: a transitive dependency of MindAR tries to build a native `canvas` module, and that build fails on machines without its system libraries (it failed here). The browser bundle doesn't need it, and `vercel.json` sets the same install command for Vercel.

## Deploy to Vercel

```bash
npm run build
npx vercel
# Vercel auto-detects Vite: Build = npm run build, Output = dist
# vercel.json already sets installCommand to npm install --ignore-scripts
```

Or import the repo in the Vercel dashboard and pick Framework = Vite. Open the `https://` URL on your phone for real AR.

## Version pin you should not "fix" casually

- `three` is pinned to `^0.160.0` because MindAR 1.2.5 imports `sRGBEncoding`, which was removed from newer Three.
- `model-viewer` 3.5 needs a much newer Three, so it is loaded from CDN instead of npm — bundling both from npm makes Vite resolve a single Three for both and the build fails with a missing-export error. If you upgrade either library, check this pair first.

## Next steps

- Swap the basketball primitives in `src/components/MarkerAR.vue` for `<a-gltf-model src="...">`
- Swap the Astronaut URLs in `src/components/ModelAR.vue` for your own `.glb` / `.usdz`
- In `ImageTracking.vue`, swap the sphere/torus primitives for a loaded `.glb` via Three's `GLTFLoader`, added to `anchor.group`

## Notes / untested

The Vite build is verified here (main chunk ~71 kB, image-tracking chunk lazy-loaded). Camera AR itself can only be verified on your device over HTTPS, with camera permission allowed.
