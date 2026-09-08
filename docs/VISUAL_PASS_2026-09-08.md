# Visual asset pass — 8 September 2026

Forward-ported onto current main `d03c466`; no combat, inventory, save, quest or simulation rules replaced.

## Real shipped assets, not concept overlays

- User-provided market stall (`13cda14c-033c-4da9-9791-b3a2db249e55.glb`): 80,000 → 31,037 triangles, normalized to 2.7 m high, embedded 2K WebP, about 1.36 MB. Removed 667 ground faces and 286 low white backdrop faces; moved the decorative stall clear of the neighboring house roof.
- User-provided barrel (`798e97dc-fe2d-4d11-982b-139f65d255a4.glb`): 80,000 → 9,589 triangles, 0.9 m high, embedded 2K WebP, about 518 KB.
- Three curved, rooted oak variants and three fractured-rock replacements. Kit material names, UVs, vertex colors and all unrelated assets preserved.
- Refined survivor head, hood, legs, shoulder cowl and jerkin hem. Original skin bind matrices checked before geometry replacement; all 14 animation clips and every channel target/value byte preserved. Anatomical sockets unchanged.
- Geometric grass ribbons replace crossed atlas rectangles. Forty short curved blades per shared tuft, 160 triangles, instanced, near-field only. Ferns unchanged.
- PBR bark, stone and layered moss/woodland floor; textured architectural surfaces; wool/leather detail on player, villagers and simulated players. Animal shading is softer and mottled, not a new animal rig.
- Conservative animation bounds enable off-screen character/animal culling. This changes rendering only, not simulation updates.
- Fixed missing bison companion palette in clean asset downloads.

## Sources / rights

The two generated props were provided and authorized for this game by its owner. Their generator's external terms were not independently verified; do not label these CC0 or resell them as a CC0 pack.

Poly Haven textures are CC0. The exact download URLs and source pages are recorded in `public/textures/terrain/sources.json`:
[Aerial Grass Rock](https://polyhaven.com/a/aerial_grass_rock), [Forest Floor](https://polyhaven.com/a/forest_floor), [Rock Face](https://polyhaven.com/a/rock_face), [Jolcham Oak Bark](https://polyhaven.com/a/jolcham_oak_bark_01).

Existing Quaternius/Kenney source attribution remains in the asset credits. This pass refines those existing meshes; it does not claim original authorship of them.

## Reproduction

Runtime assets are checked into `public/`; deployment needs neither Blender nor local Downloads paths. The existing prebuild fetchers supply the existing third-party packs.

Local authoring masters are ignored in `assets/source/visual-pass/`. The user's original GLBs are never overwritten. `pack-imported-props.mjs` packs the normalized Blender exports; `fetch-visual-surfaces.mjs` vendors the CC0 maps; `author_visual_nature.py` and `refine_visual_character.py` author isolated Blender scenes; `integrate-visual-meshes.mjs` grafts only their geometry onto preserved shipping files. Do not repeatedly subdivide an already refined survivor: use the original input from the baseline commit. Blender's open file is not saved automatically.

## Acceptance scope

The visual request remains open: this is a concrete replacement/material pass, not a claim of concept-art parity or that every model is now premium quality. The bison and some distant buildings remain simple source silhouettes; faces and clothing still benefit from a purpose-authored hero asset. Broad settlement clearings and remaining ground-cover composition need further art direction. No new gameplay content is claimed.

Regression gates include embedded prop textures/normals/scale/budgets, byte-identical survivor animations, preserved animal topology/weights, whole-body culling envelope and vendored surface provenance. Actual gameplay screenshots and measured performance, not the title screen alone, are the visual checks.

Local verification: 341 tests pass; production build passes with existing chunk warnings. Gameplay inspected at road, village and close range. A local-only `/dev/asset-review.html` inspection scene uses the exact runtime assets/materials for orbitable Market, Barrel, Survivor, Woodland, Animals and Cottage views; it is explicitly not a gameplay screenshot.
