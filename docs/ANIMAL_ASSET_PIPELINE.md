# Alderwatch animal/model pipeline — Blender optional

Blender is **not required** to add a model when the source is already a usable `.glb`/`.gltf` with acceptable scale, materials and (for moving creatures) skeletal clips.

## Fast path: ready-to-use GLB

1. Find or generate a model whose license permits redistribution.
2. Prefer one self-contained GLB with embedded textures and animations.
3. Record creator, source URL and license in `ASSET_CREDITS.md`.
4. Put the file under `public/assets/...`, or add a pinned reproducible fetch entry such as `scripts/fetch_animals.mjs`.
5. Load with Three.js `GLTFLoader`; use `SkeletonUtils.clone()` for multiple animated instances.
6. Normalize visible size in code from the GLB bounding box rather than guessing authoring units.
7. Select embedded Idle/Walk/Run clips by semantic name and crossfade between them.
8. Run `npm test` and `npm run build`, then visually inspect the real game. Automated build success is not visual acceptance.

For the goat/sheep/deer/bear pass, `npm run assets:animals` downloads pinned licensed binaries. `predev` and `prebuild` invoke it automatically, so a fresh clone does not need Blender.

## When Blender *is* useful / required

Use Blender (or another DCC/rigging tool) when the asset needs actual authoring work: broken pivots, mesh surgery, material/UV repair, adding missing bones, retargeting incompatible animation rigs, creating bespoke collisions, joining modular parts, baking texture changes, or aggressive hand-tuned optimization.

Do **not** route every model through Blender by default. Runtime code plus `gltf-transform` is enough for many production-ready GLBs. Blender is the repair/custom-authoring lane, not the mandatory import gate.

## Browser-production rules

- Keep authored adult proportions; normalize dimensions deliberately in metres.
- Never replace a missing model with visible primitive programmer art in the shipping scene.
- Keep animation with the creature. A moving static model that slides is a failed asset.
- Prefer local/pinned assets in production over arbitrary live CDN dependencies.
- Compress only after checking animation/material correctness. Meshopt is safe for skeletal animation when decoded by the runtime; Draco choices must be validated per asset.
- Preserve licensing evidence alongside code. CC-BY assets require attribution even when modified or optimized.

## Current extended wildlife

- Goat and sheep: pasture animals near Alderbrook; flee from close players and return to their home area.
- Deer: wider-ranging Southwood animals with a larger flight radius and faster escape speed.
- Bear: larger Ironward/Briar wildlife, slow-turning and currently ambient rather than a combat enemy. Hunting/hostile bear combat should be implemented as a separate authoritative gameplay pass rather than faked inside visual wildlife code.

Existing hare/crow state and saves remain additive and authoritative.
