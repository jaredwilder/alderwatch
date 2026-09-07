# Alderwatch animal/model pipeline — Blender optional

Blender is **not required** to add a model when the source is already a usable `.glb`/`.gltf` with acceptable scale, materials and (for moving creatures) skeletal clips.

## Fast path: ready-to-use GLB

1. Find or generate a model whose license permits redistribution.
2. Prefer one self-contained GLB with embedded textures and animations.
3. Record creator, source URL and license in `ASSET_CREDITS.md`.
4. Add a pinned reproducible fetch entry in `scripts/fetch_animals.mjs` rather than a live runtime dependency.
5. Add scale/aim/combat/behavior tuning to `src/wildlife-species.ts`; do not create another species-specific constants map.
6. Add stable encounter placement to `src/wildlife-spawns.ts`.
7. Load with Three.js `GLTFLoader`; `animal-models.ts` uses `SkeletonUtils.clone()` and bounding-box height normalization for every authored species.
8. Prefer semantic Idle/Walk/Run/Attack/Fly clip lookup and crossfade between them.
9. Put genuinely new behavior domains in focused modules (`wildlife-aerial.ts`, pack AI, etc.) rather than adding giant species branches to rendering code.
10. Run `npm test` and `npm run build`, then visually inspect the real game. Automated build success is not visual acceptance.

For the goat/sheep/deer/bear/bison/wolf/eagle set, `npm run assets:animals` downloads pinned licensed binaries. `predev` and `prebuild` invoke it automatically, so a fresh clone does not need Blender.

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
- Aerial species must have an explicit grounded state; never make them permanently untouchable scene decorations.

## Current wildlife

- Goat and sheep: pasture animals near Alderbrook; flee from close players and return to their home area.
- Deer: wider-ranging Southwood animals with a larger flight radius and faster escape speed.
- Bison: a five-animal high-meadow herd using Kenney's animated CC0 Prototype Kit bison; slow ambient drift, grazing pauses, herd cohesion and defensive flight.
- Bear: uncommon solo predators. Bears hunt smaller prey, including grounded exhausted eagles, and attack nearby/provoking players through authoritative predator combat.
- Wolf: Quaternius CC0 animated predators in packs capped at three. Wolves acquire bison, approach on deterministic flank points, turn onto interfering players, and may take exhausted grounded eagles.
- Eagle: Asim3d CC BY animated aerial predators, capped at three territories. Eagles can carry hare/sheep, kill crows, drain persistent energy in flight, land when exhausted, recover slowly on foot, then take off again if they survive ground predators.
- Crow: legacy authored wildlife. Crow carcasses yield the `crow_crop` ingredient used by the campfire-only Crow milk recipe.

Gameplay architecture is documented in `docs/WILDLIFE_ARCHITECTURE.md`. Existing wildlife state and saves remain additive and authoritative.
