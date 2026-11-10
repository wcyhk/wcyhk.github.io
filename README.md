# WCY.HK STUDIO

Personal portfolio hosted on GitHub Pages at https://wcy.hk.

Static HTML, CSS and JavaScript; project metadata refreshes from the public wcyhk GitHub account. Existing project sites and cloud services are linked externally. CV source files and private contact details are not included.

The qingming-hand-treasure and neighbour directories preserve existing compatibility entry routes.

## 世界的盡頭 / The End of the World

The About section contains a local Three.js 3D world. Drag to orbit, use the wheel to zoom, and awaken the Education, Technology and Creativity beacons. The monumental black-hole gate remains dark through the first two lights; the third transforms its event horizon into a radiant sun and warms the surrounding world. Arrow keys and +/- also control the camera; Space pauses the star flow and R restores the view. On phones, enable exploration explicitly, then choose “完成探索” to return to page scrolling. “重新探索” resets all three beacons and restores the black hole.

`time-experience.js` and its stylesheet retain their existing entry filenames; `world-model.mjs` owns discovery state, `world-scene.mjs` builds the procedural landscape, and `world-post.mjs` supplies the HDR glow. Three.js r170 and OrbitControls are vendored with their MIT license. No external image, model, API, account or audio is needed for this work. Rendering stops offscreen, respects reduced motion, caps resolution and offers lightweight rendering. Personal introduction text remains in HTML and can be read even if WebGL is unavailable.

The landscape uses procedural PBR stone and engraved inlays, environment reflections, soft shadows and beveled ruins. The black hole has an animated accretion disk and lensed halo; the sun adds granulation, sunspots and magnetic prominences. Fine and wide bloom retain highlight detail. `world-materials.mjs` owns generated textures and environment resources. A masked, transparent paper-to-stardust gradient overlaps only the empty footer padding of the project gallery, preserving its disclaimer and links.

Run `node --test tests/*.test.mjs` for discovery, camera/raycast geometry, mapped-surface UVs, biography, and existing entry-route checks.
