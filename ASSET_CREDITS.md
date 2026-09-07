# Asset credits and provenance

The locally supplied license files for Quaternius Universal Base Characters (Standard), Modular Character Outfits — Fantasy (Standard), and Animation Library (Standard) each specify CC0 1.0 Universal. Their character, Ranger outfit and animation data contribute to the shipped survivor. Author: Quaternius, https://quaternius.com/ . License reference: https://creativecommons.org/publicdomain/zero/1.0/ . Original license files remain with the local downloaded source packs.

Environment kit, equipment, original hare/crow wildlife and modifications were authored for Alderwatch through Blender. Concept art and texture images were AI-generated for this project; available prompts/provenance are in art/concepts/prompts.md, art/textures/prompts.md, and art/direction-v2/.

## Runtime-downloaded animal models

`npm run assets:animals` downloads pinned GLB files into `public/assets/animals/` for local development and production builds. These generated/downloaded binaries are not treated as Alderwatch-authored art.

- **Sheep** — Quaternius Farm Animal Pack, CC0 1.0. Runtime GLB mirrored from `SeloSlav/medieval-settlement-threejs` at commit `adebb282d...`; that repository records the original Quaternius Farm Animal Pack provenance and preserves the sheep rig/actions.
- **Goat** — CC0 derivative in `SeloSlav/medieval-settlement-threejs`, built from the Quaternius sheep body plus Quaternius cow horn geometry under the same CC0 terms. Runtime source is pinned to commit `adebb282d...`.
- **Deer** — Quaternius, CC0 1.0. Runtime GLB mirrored from `SeloSlav/medieval-settlement-threejs` at commit `adebb282d...`; original Poly Pizza model: https://poly.pizza/m/T6Cs7tmMHJ .
- **Bear** — “Realistic Animated Bear 3D Model” by **AnimalMesh 3D**, Creative Commons Attribution 4.0. Original source: https://sketchfab.com/3d-models/realistic-animated-bear-3d-model-bffc3c87d2d148ff8533e1cc8a11c9f1 . Alderwatch downloads the optimized locomotion-only GLB mirrored by `TuanTran0168/myunivokai-personalized-3d-worlds` at pinned commit `9112af6c...`; that mirror records texture resizing/meshopt compression while retaining required attribution.
- **Bison** — Kenney Prototype Kit 1.0, Creative Commons Zero (CC0). Kenney's pack license explicitly permits personal, educational and commercial use with attribution optional. Alderwatch downloads only `animal-bison.glb` from the `series-ai/jam-ready-assets` mirror pinned to commit `e93aa129...`; the mirror preserves the original Kenney `License.txt` alongside the model. Official source: https://kenney.nl/assets/prototype-kit .

The fetcher validates GLB headers and minimum file sizes and never silently substitutes primitives. If a source cannot be downloaded, the build fails rather than shipping a fake animal.

Third-party JavaScript dependencies retain their own licenses. See package-lock.json and installed package license files. This credits note does not apply a new open-source license to the original game code or art; no project-wide license has been selected by the owner.
