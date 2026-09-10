# Asset credits and provenance

The locally supplied license files for Quaternius Universal Base Characters (Standard), Modular Character Outfits — Fantasy (Standard), and Animation Library (Standard) each specify CC0 1.0 Universal. Their character, Ranger outfit and animation data contribute to the shipped survivor. Author: Quaternius, https://quaternius.com/ . License reference: https://creativecommons.org/publicdomain/zero/1.0/ . Original license files remain with the local downloaded source packs.

Environment kit, equipment, legacy hare/crow fallback meshes and modifications were authored for Alderwatch through Blender. Concept art and texture images were AI-generated for this project; available prompts/provenance are in art/concepts/prompts.md, art/textures/prompts.md, and art/direction-v2/.

## Runtime-downloaded medieval settlement models

`npm run assets:medieval` downloads a pinned, audited set of self-contained GLBs into `public/assets/medieval/`. The source mirror is `jm-sky/seedvale` at commit `9e69e3d8898f8105d06ceac92c95981482810163`, whose adjacent credits and license records identify these Quaternius packs as **CC0 1.0**.

- **Quaternius Medieval Village MegaKit (Standard/free)** — modular plaster/timber walls, doors, windows, tiled and wooden roofs, chimney, wagon, crate, wooden fences, supports, stairs, vines and trim. CC0 1.0.
- **Quaternius Ultimate Fantasy RTS settlement set** — complete authored `hut_a`–`hut_d`, `towerhouse`, `watchtower`, `barracks`, `storage`, `market`, `towncenter`, `windmill`, `well`, settlement `wall` and `farm` models. CC0 1.0.
- **Quaternius settlement props** from the same audited source family — crops, barrel, cauldron, hay, wood pile, lantern, torch and burning campfire. CC0 1.0.

These assets are intentionally downloaded at build time from the pinned mirror rather than a mutable runtime CDN. The fetcher validates GLB headers and minimum sizes and fails the build instead of silently substituting primitives.

## Runtime-downloaded NPC character skins

`npm run assets:characters` downloads the textured **KayKit Adventurers Character Pack 1.0** variants used by Alderbrook townsfolk into `public/assets/characters/`. Creator: **Kay Lousberg / KayKit**. License: **CC0 1.0**; the upstream license explicitly permits personal, educational and commercial use. Source pack: https://kaylousberg.itch.io/kaykit-adventurers .

Alderwatch pins the public, license-preserving mirror `euuuuuuan/cairnfall-public` at commit `8ee4cfd789282c59632a9339e61564b7d6c1acfe` and downloads only `Barbarian.glb`, `Knight.glb`, `Mage.glb`, `Rogue.glb` plus their adjacent textures. The mirror keeps KayKit's `LICENSE.txt` beside those files. The build fetcher validates model/image signatures and expected minimum sizes and fails closed on a corrupt or missing payload. These NPC skins are presentation-only; the existing Alderwatch survivor remains the fallback if a skin cannot load at runtime.

## Runtime-downloaded animal models

`npm run assets:animals` downloads pinned GLB files into `public/assets/animals/` for local development and production builds. These generated/downloaded binaries are not treated as Alderwatch-authored art.

- **Hare** — Quaternius “Bunny”, CC0 1.0. Original Poly Pizza model: https://poly.pizza/m/irZjWFARyl . Alderwatch downloads the animated GLB from `JacksonHe04/iNon` pinned to commit `a4b591c...`; that mirror's adjacent source record identifies its archived Quaternius animal collection as CC0. Alderwatch applies the hare coat palette and scale at runtime.
- **Crow** — Quaternius animated “Pigeon” used as a crow visual base, CC0 1.0. Original Poly Pizza model: https://poly.pizza/m/9NGlBTpDEr . Alderwatch downloads the GLB from `danajerban/erbandanaj.com` pinned to commit `da89c1e...`; the mirror's component attribution identifies Quaternius and uses the authored `Flying_Idle` action. Alderwatch applies a black/blue-black crow palette at runtime while preserving the authored rig and flight animation.
- **Sheep** — Quaternius animated “Sheep” (`rgJXF570ZK`), CC0 1.0 / public domain. Original Poly Pizza model: https://poly.pizza/m/rgJXF570ZK . Alderwatch downloads the exact 223,324-byte GLB from `AncheJeez/LearningGodot` pinned to commit `baf5a889...`; the mirror filename preserves the Quaternius creator attribution and Poly Pizza model ID. Alderwatch applies a warmer wool palette and procedural fleece breakup at runtime while preserving the authored rig and animation data.
- **Goat** — CC0 derivative in `SeloSlav/medieval-settlement-threejs`, built from the Quaternius sheep body plus Quaternius cow horn geometry under the same CC0 terms. Runtime source is pinned to commit `adebb282d...`.
- **Deer** — Quaternius, CC0 1.0. Runtime GLB mirrored from `SeloSlav/medieval-settlement-threejs` at commit `adebb282d...`; original Poly Pizza model: https://poly.pizza/m/T6Cs7tmMHJ .
- **Rabbit, fox, wild boar and stag** — Quaternius Wild Animals, CC0. Alderwatch downloads the animated `rabbit.glb`, `fox.glb`, `boar.glb` and `stag.glb` from `StateDev08/War-of-the-Kindom-Mobile` pinned to commit `9b5a2827...`. The adjacent `README_ANIMALS.md` names all four species, identifies the collection as **Quaternius Wild Animals (CC0)**, and records Idle/Walk animation use. The Alderwatch fetcher also checks the exact pinned byte length of each GLB.
- **Bear** — “Realistic Animated Bear 3D Model” by **AnimalMesh 3D**, Creative Commons Attribution 4.0. Original source: https://sketchfab.com/3d-models/realistic-animated-bear-3d-model-bffc3c87d2d148ff8533e1cc8a11c9f1 . Alderwatch downloads the optimized locomotion-only GLB mirrored by `TuanTran0168/myunivokai-personalized-3d-worlds` at pinned commit `9112af6c...`; that mirror records texture resizing/meshopt compression while retaining required attribution.
- **Bison** — Quaternius “Bull”, CC0 1.0. Alderwatch uses the rigged bovine as a bison visual base and applies the bison coat palette/scale at runtime. Runtime GLB mirrored from `SeloSlav/medieval-settlement-threejs` at commit `adebb282d...`; its adjacent livestock license identifies the Bull as Quaternius CC0. Original source: https://poly.pizza/m/a8PIIYwF7r .
- **Wolf** — Quaternius Wild Animals, Creative Commons Zero (CC0). Alderwatch downloads the animated `wolf.glb` from `StateDev08/War-of-the-Kindom-Mobile` pinned to commit `9b5a2827...`. That mirror stores the model under `models/quaternius/animals/` and its adjacent `README_ANIMALS.md` explicitly records the collection as “Quaternius Wild Animals (CC0)”. Creator source: https://quaternius.com/ .
- **Eagle** — “animated EAGLE” by **Asim3d**, Creative Commons Attribution 4.0. Original model: https://sketchfab.com/3d-models/animated-eagle-8fb150270adb45aa9653e857f3fa351b . Alderwatch downloads the animated GLB mirrored by `maramilod/LYMonada` at pinned commit `677cdce7...`; the adjacent download-origin metadata records that exact Sketchfab model ID. License: https://creativecommons.org/licenses/by/4.0/ .

The fetchers validate GLB headers and minimum file sizes and never silently substitute primitives. If a source cannot be downloaded, the build fails rather than shipping a fake asset.

Third-party JavaScript dependencies retain their own licenses. See package-lock.json and installed package license files. This credits note does not apply a new open-source license to the original game code or art; no project-wide license has been selected by the owner.
# September 8 visual pass

New user-supplied generated stall/barrel, Poly Haven CC0 PBR surfaces, and refinements to existing licensed meshes: see [visual-pass provenance and limitations](docs/VISUAL_PASS_2026-09-08.md). Exact texture URLs are vendored in `public/textures/terrain/sources.json`. The user-provided generated meshes are **not** represented as CC0.
