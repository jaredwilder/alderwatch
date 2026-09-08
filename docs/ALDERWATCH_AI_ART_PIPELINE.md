# ALDERWATCH AI ART + 3D ASSET PIPELINE

**Status:** Canonical production workflow for Alderwatch art generation and handoff.

**Purpose:** Jared can art-direct and generate large amounts of coherent game art in parallel while the game code continues moving. If later casual advice conflicts with this document, **this document wins until we deliberately revise it**.

---

## 0. THE ONE-SENTENCE PIPELINE

**LOCK THE ALDERWATCH STYLE → GENERATE CONTROLLED MULTIVIEW REFERENCE ART → GENERATE/REMESH PBR GLB → PACKAGE WITH SCALE + LICENSE METADATA → UPLOAD THE ZIP → INTEGRATE, OPTIMIZE, TEST IN-GAME, REJECT ANYTHING THAT DOES NOT LOOK BETTER IN THE ACTUAL GAME.**

That is the pipeline. Do not mass-generate random isolated 3D objects directly from text.

---

# 1. THE VISUAL TARGET

Alderwatch is:

- adult medieval frontier fantasy
- grounded rather than chibi, voxel, toy, or mobile-game fantasy
- stylized hand-painted PBR rather than photorealistic
- bright, readable daylight by default
- believable human scale and construction
- weathered timber, fieldstone, lime plaster, iron, leather, linen, wool, thatch, mud, moss, soot, smoke and embers
- rich natural color without oversaturation
- moderately chunky/readable silhouettes for gameplay, but never Fisher-Price proportions
- handmade irregularity without looking broken
- visibly old-world, practical and inhabited

**Do not prompt with other game names.** We can borrow design lessons from games we love, but generated assets should be described by material, proportion, silhouette and mood so Alderwatch develops its own identity.

## Non-negotiable negative style list

Every major generation prompt should include the equivalent of:

> NOT chibi. NOT voxel. NOT Minecraft. NOT low-detail mobile game. NOT Fisher-Price fantasy. NOT giant-headed. NOT plastic. NOT glossy toy materials. NOT ornate high-fantasy palace design. NOT random steampunk. NOT photoreal scan. NOT baked cinematic lighting. NOT exaggerated impossible proportions.

---

# 2. LOCK THE MASTER STYLE BOARD BEFORE MASS PRODUCTION

Before generating dozens of assets, make **one Alderwatch Master Style Board**. This is the visual DNA that should be fed back into later image/texture generations whenever possible.

The board should show these material swatches and object examples under neutral daylight:

### Materials

- weathered oak
- rough-sawn pine
- whitewashed lime plaster
- irregular fieldstone
- worn hand-forged iron
- aged steel
- brown vegetable-tanned leather
- undyed linen
- dirty natural wool
- straw/thatch
- moss
- damp mud
- soot/ash

### Shape language

- thick load-bearing timber
- visible joinery
- plausible roof support
- heavy practical doors
- hand-forged hardware
- modest medieval ornament
- asymmetric handmade construction
- believable adult proportions
- silhouettes readable at gameplay distance

### Weathering language

- subtle edge wear
- rain streaks on plaster
- mud/darkening near ground level
- soot near chimneys/fire
- restrained moss on wet/shaded surfaces
- split/sun-checked timber
- light iron oxidation
- no universal apocalypse grime

### Palette

- warm brown wood
- cream/off-white plaster
- charcoal iron
- moss/fern greens
- straw ochres
- muted linen colors
- restrained rust reds
- cold gray stone
- blue daylight sky

Save the approved board in every art pack under `references/alderwatch_master_style_board.png` or include a copy/link to the same canonical image.

---

# 3. THE GOLDEN RULE FOR 3D GENERATION

## DO NOT generate each camera angle independently from text.

That causes the front, side and rear to quietly become different objects.

Instead:

1. Generate one excellent **hero reference** for the object.
2. Approve its design.
3. Use that hero image as the identity reference to generate a turnaround/multiview sheet of **the exact same object**.
4. Crop/export the individual views.
5. Feed those views to the 3D generator as multiview conditioning.

For important assets, this is dramatically more reliable than text-to-3D.

## Required multiview sheet

Prefer:

- FRONT
- LEFT
- BACK
- RIGHT
- optional 3/4 beauty view for human review only

All orthographic or near-orthographic, same scale, same object, same materials, neutral background, no props occluding the asset.

### Turnaround prompt template

Use this as the base and replace the bracketed fields:

> **ALDERWATCH 3D ASSET TURNAROUND — [ASSET NAME].** Create a production model sheet of the exact same object shown in FRONT, LEFT, BACK and RIGHT orthographic views. Adult grounded medieval frontier design. Hand-painted stylized PBR material language. [MATERIALS]. [IMPORTANT STRUCTURAL DETAILS]. Realistic practical proportions. Neutral mid-gray studio background. Flat soft neutral illumination. Entire object visible in every view. Identical dimensions and construction in every panel. No perspective distortion. No depth of field. No environmental props. No cast shadow obscuring the silhouette. No text except tiny view labels if necessary. NOT chibi, voxel, toy, mobile-game, plastic, ornate high fantasy, steampunk or photoreal scan.

If the image tool supports editing/reference images, use the approved hero reference as the image input so identity is preserved.

---

# 4. PRIMARY 3D TOOL STRATEGY — LOCKED

The pipeline is **provider-independent**, but our default starting stack is:

## Primary generation: TRIPO MULTIVIEW

Use Tripo first for static props, structures and many environment assets because its current multiview workflow explicitly accepts labeled views of one object and can output PBR GLB.

Recommended intent:

- multiview/image-to-3D, not pure text-to-3D
- texture on
- PBR on
- detailed geometry for the source generation
- UVs enabled
- GLB output

Do not obsess over final polycount inside the first generation if the shape is excellent; geometry can be remeshed afterward.

## Cleanup/remesh/texturing: MESHY

Use Meshy as the first cleanup tool when a generated model has good shape but poor topology or texture treatment.

Useful operations:

- remesh to target polygon count
- quad or triangle topology depending on asset
- AI texturing from the Alderwatch style reference
- **Remove Lighting = ON**
- **Generate PBR Maps = ON**
- GLB export

Meshy is especially useful as a second-stage processor even when the original geometry came from another generator.

## Precision/fallback generation: RODIN

Use Rodin when:

- Tripo shape reconstruction is weak
- physical bounding dimensions matter strongly
- a multi-image object needs another reconstruction approach
- we need a specific target face count or bounding box during generation

Preferred settings:

- multi-image mode treating images as views of the **same object** (`concat` conceptually)
- PBR material, not baked shaded material
- GLB
- target face count appropriate to the asset class
- use bounding-box control when dimensions are known and important

## ONE-TIME BAKEOFF BEFORE MASS PRODUCTION

Before generating 200 assets, generate the exact same three references through Tripo, Meshy and Rodin:

1. simple: **Alderwatch weathered barrel**
2. medium: **Alderbrook timber market stall**
3. hard: **mature Alderwatch oak**

Upload all nine GLBs in one ZIP. We judge them **inside Alderwatch**, not by each vendor's preview render. Then we lock a primary generator for each asset class.

After that bakeoff, do not keep randomly changing tools because another site produced one pretty marketing image.

---

# 5. TECHNICAL ASSET CONTRACT

For normal static world assets, the preferred handoff is:

- **glTF 2.0 GLB**
- meters
- +Y up
- +Z forward
- object bottom-centered at or near world origin
- real-world scale
- UV unwrapped
- PBR metallic/roughness workflow
- base color/albedo
- roughness
- metallic where relevant
- normal map
- alpha mask for foliage where needed
- no directional sunlight baked into base color
- no giant hidden collision meshes
- no mystery 100x parent scaling

Alderwatch uses Three.js `GLTFLoader`, so GLB is the clean default runtime format.

## Material rule

Base color should describe the material itself, **not the material plus a studio photograph of lighting**.

Dynamic game lighting supplies the sun, shadow, fog and atmosphere. If the source albedo contains a giant fake highlight or directional shadow, it will look wrong as soon as the real sun moves relative to it.

---

# 6. PRACTICAL POLYGON + TEXTURE BUDGETS

These are targets, not religious laws. A beautiful source can be optimized after upload.

| Asset class | Suggested triangle range | Typical texture |
|---|---:|---:|
| tiny clutter / food / small bottle | 300–1,500 | 512 px |
| barrel / crate / chair / bucket | 1k–4k | 1K |
| weapon / hand tool | 2k–6k | 1K |
| large prop / cart / market stall | 3k–10k | 1K–2K |
| ordinary tree | 3k–10k | 1K–2K |
| hero mature tree | 8k–20k | 2K |
| modular wall / roof / gate piece | 1k–6k | 1K–2K |
| important complete building | ~15k–40k | 2K |
| background building | lower than hero equivalent | 1K |

Avoid 8K textures unless there is an extraordinary reason. A browser survival RPG benefits far more from coherent art, good material response, strong silhouettes, instancing/LOD and sane draw-call behavior than from microscopic texture resolution.

---

# 7. REAL-WORLD SCALE CONTRACT

Every asset pack must state intended dimensions.

Use meters.

Useful Alderwatch reference dimensions:

- adult human: ~1.7–1.9 m
- normal door opening: ~1.0 m wide × 2.1 m tall
- modular wall bay: **2.0 m wide × ~2.7 m tall**
- floor/foundation module: **2 × 2 m**
- heavy timber support: roughly 0.18–0.28 m thick
- workbench: ~0.9 m tall
- table: ~0.75 m tall
- barrel: ~0.85–1.0 m tall
- mature oak: usually ~12–18 m tall for hero gameplay trees

Do not rely on the generator's visual sense of scale. State the intended dimensions in the manifest/README.

---

# 8. WHAT AI SHOULD OWN VS WHAT IT SHOULD NOT RANDOMIZE

## A. MASS-PRODUCE WITH AI NOW

Excellent candidates:

- barrels
- crates
- sacks
- baskets
- buckets
- carts
- wagon clutter
- tables/chairs/benches
- beds/cupboards
- anvils
- forge clutter
- chopping blocks
- wood piles
- coal piles
- hay bales
- cooking pots
- cauldrons
- lanterns
- torches
- signs
- market stalls
- palisade pieces
- fence pieces
- gravestones
- road markers
- ruined debris
- weapon racks
- shields
- helmets
- swords
- axes
- picks
- hammers
- bows
- spears
- antlers
- trophies
- camps and occupation clutter

## B. GENERATE AS MODULAR FAMILIES

Do not make 40 unrelated complete houses.

Make one coherent construction language:

- 2 m plaster wall
- 2 m timber wall
- door wall
- window wall
- interior/exterior corner
- support beam
- floor
- foundation
- straight roof
- roof ridge
- roof end/gable
- roof corner
- stairs
- door
- shutter
- chimney
- porch/awning

Then use the same family to build houses, workshops, barns, inns and fortified compounds.

## C. NATURE MUST BE FAMILIES TOO

Example oak family:

- mature oak A/B/C
- young oak A/B
- dead oak
- stump A/B
- fallen trunk A/B
- chopped log variants

Do the same for pines/birches if introduced.

Rocks, mushrooms, flowers and bushes should also arrive as coherent variation sets, not isolated snowflakes.

## D. HUMAN CHARACTERS: DO NOT RANDOMLY REPLACE THE RIG

The live game already has a coherent adult survivor skeleton/animation/equipment-socket system. Do not mass-generate fully unrelated NPC bodies with random skeletons.

For now, use AI to design/generate:

- clothing reference sheets
- armor reference sheets
- helmets
- capes/cloaks
- backpacks
- belts/pouches
- hair concepts
- shields
- weapons
- NPC portraits

We should deliberately build compatible wearable geometry around a stable human rig rather than repeatedly throwing away animation compatibility.

## E. ANIMALS

AI can generate animal base meshes/reference art, but rigging and locomotion consistency are a separate production step. A beautiful deer with an incompatible skeleton is not automatically a useful game deer.

Treat animals species-by-species and preserve a stable rig/animation family once approved.

---

# 9. TWO-DIMENSIONAL ART LANE — GO VERY FAST HERE

This should run in parallel with 3D.

Generate directly with image generation:

- item icons
- resource icons
- food icons
- armor icons
- weapon icons
- buff/debuff icons
- skill icons
- achievement crests
- reputation emblems
- faction heraldry
- bounty seals
- map ornaments
- parchment panel textures
- slot frames
- separators
- dialogue portraits later
- shop signs
- banners
- decals
- stains/scorch/mud/moss overlays

## Canonical inventory icon prompt

> **ALDERWATCH INVENTORY ICON — [ITEM].** One centered medieval game item on transparent background. Grounded adult frontier aesthetic. Slightly painterly hand-painted PBR illustration. Natural material detail. Strong readable silhouette at 48–64 px. Consistent 3/4 isometric-ish camera used across the entire icon family. Soft neutral key light only. No text. No UI border baked into the image. No environment. No hands. No dramatic background. NOT cartoon, chibi, mobile-game candy art, voxel, neon, photoreal catalog photography or ornate high fantasy.

Generate large (for example 512 or 1024 square) and downsample for the game.

**Important:** keep the border/frame separate from the item image. That lets rarity frames, selection states and disabled states work without regenerating every item.

---

# 10. PACK-FIRST PRODUCTION ROADMAP

Do not generate assets in random order. Work in packs that visibly transform one place/system at a time.

Recommended order:

1. **Alderbrook Village Pack** — doors, shutters, awnings, signs, benches, carts, barrels, baskets, wood piles, laundry, crates, planters, small household clutter.
2. **Market Pack** — stalls, counters, scales, baskets, produce, awnings, trade signs, coin chest, merchant clutter.
3. **Blacksmith Pack** — forge, anvil, bellows, quench barrel, hammer rack, coal bin, tongs, weapon blanks.
4. **Hunter/Fletcher Pack** — bow rack, arrow bundles, hide frames, tanning clutter, traps, trophy rack.
5. **Woodcutter Pack** — splitting block, saw bench, log stacks, axe rack, timber sled/cart, wood sheds.
6. **Farm Pack** — fences, troughs, carts, hay, sacks, produce baskets, scarecrow, simple field tools.
7. **Frontier Camp Pack** — believable shelters, bedrolls, cookfire gear, supply stacks, defensive clutter.
8. **Bandit/Outlaw Pack** — rougher variants, barricades, cages, stolen goods, trophy stakes, dirty tents.
9. **Road/Ruin Pack** — milestones, shrines, broken carts, grave markers, collapsed masonry, abandoned camps.
10. **Nature Pack** — tree families, stumps, logs, rock families, mushrooms, bushes, flowers, wetlands clutter.
11. **Weapons + Armor Pack** — coherent progression families rather than unrelated hero weapons.
12. **Household/Interior Pack** — beds, tables, shelves, chests, lamps, rugs, kitchen clutter.
13. **UI/Icon Pack** — complete core item/resource/food/skill/buff set using one consistent image language.

Finish one pack, upload it, integrate it, look at the live game, then use those screenshots to decide the next pack.

---

# 11. EXACT STEP-BY-STEP WORKFLOW FOR ONE ASSET PACK

## STEP 1 — Define the pack

Write the list of 10–30 assets before generating.

Example:

```text
Alderwatch Blacksmith Pack v1
- forge
- anvil
- bellows
- quench barrel
- coal bin
- hammer rack
- tongs
- sword blank
- axe blank
- grinding wheel
- firewood pile
- smithing stool
```

## STEP 2 — Gather the style inputs

Use:

- the Alderwatch Master Style Board
- one or two approved live Alderwatch screenshots
- any approved concept art relevant to this pack

## STEP 3 — Generate the pack beauty/concept board

Generate the items together once so the **family** is established.

The board is for design consistency, not 3D reconstruction.

## STEP 4 — Approve individual designs

Pick the version of each asset that belongs in Alderwatch.

Reject anything that looks:

- too cute
- too clean
- too ornate
- too fantasy-royal
- structurally impossible
- visually inconsistent with neighboring assets

## STEP 5 — Make turnaround sheets

For each important object, generate FRONT/LEFT/BACK/RIGHT from the approved image reference.

Do not independently re-prompt four views from scratch.

## STEP 6 — Generate 3D

Default: Tripo multiview.

Use the four views of the same object. Generate the best geometry first.

## STEP 7 — Inspect the 3D model before polishing

Check:

- silhouette
- proportions
- missing backside geometry
- accidental holes
- bizarre duplicate surfaces
- symmetry where appropriate
- whether thin parts survived
- whether it actually resembles the approved reference

If geometry is fundamentally wrong, regenerate now. Do not spend time texturing a bad mesh.

## STEP 8 — Remesh/optimize if needed

Use Meshy remesh or equivalent to reach the asset's budget while preserving silhouette.

Small props can be aggressively reduced. Hero assets can stay heavier.

## STEP 9 — PBR texture

Use the approved Alderwatch style/material reference.

- remove baked lighting
- generate base color
- generate normal
- generate roughness
- generate metallic when applicable

Preview under multiple neutral HDRI/light directions if your tool allows it. If the model only looks good under one baked-light angle, the material is wrong.

## STEP 10 — Export GLB

Prefer one self-contained `.glb` per normal asset.

## STEP 11 — Prepare a preview

Save one simple PNG preview for quick human browsing.

## STEP 12 — Write the manifest

At minimum include:

- asset filename
- intended dimensions in meters
- generated-with tool/version
- license/commercial-rights note
- whether it is hero/normal/background
- any known issue

## STEP 13 — ZIP THE PACK

Use the handoff structure below.

## STEP 14 — Upload the ZIP here

Send the actual ZIP, not only screenshots.

Then the integration side can:

- inspect geometry
- inspect material maps
- normalize scale/orientation
- optimize/compress
- add collision/LOD/instancing rules
- register assets cleanly
- replace placeholders
- run build/tests
- judge actual gameplay screenshots

---

# 12. PERFECT HANDOFF ZIP

```text
alderwatch_blacksmith_pack_v1/
    README.md
    asset-manifest.json
    references/
        alderwatch_master_style_board.png
        blacksmith_pack_concept.png
        forge_turnaround.png
        anvil_turnaround.png
    models/
        aw_blacksmith_forge_a.glb
        aw_blacksmith_anvil_a.glb
        aw_blacksmith_bellows_a.glb
        aw_blacksmith_quench_barrel_a.glb
        ...
    previews/
        aw_blacksmith_forge_a.png
        aw_blacksmith_anvil_a.png
        ...
    source_optional/
        # only if there is useful source material worth retaining
```

## README template

```md
# Alderwatch Blacksmith Pack v1

Generated with: [tool + version]
Date: YYYY-MM-DD
Commercial-use status: [brief statement based on your account/tool terms]

Visual target:
Adult grounded medieval frontier, Alderwatch master style board.

Scale anchors:
- forge: 1.8 m wide
- anvil: 0.75 m tall
- door reference if present: 2.1 m tall

Notes:
- forge is hero prop
- coal bin is ordinary clutter
- bellows animation is NOT included
```

## `asset-manifest.json` example

```json
{
  "pack": "alderwatch_blacksmith_pack_v1",
  "generator": "Tripo",
  "units": "meters",
  "upAxis": "+Y",
  "forwardAxis": "+Z",
  "assets": [
    {
      "file": "models/aw_blacksmith_anvil_a.glb",
      "intendedSizeMeters": [0.55, 0.75, 1.05],
      "class": "normal-prop",
      "notes": "Hand-forged iron; no baked lighting"
    }
  ]
}
```

---

# 13. NAMING RULES

Use lowercase predictable runtime-friendly names.

Pattern:

```text
aw_[pack]_[asset]_[variant].glb
```

Examples:

```text
aw_market_stall_a.glb
aw_market_stall_b.glb
aw_blacksmith_anvil_a.glb
aw_forest_oak_mature_a.glb
aw_forest_oak_stump_a.glb
aw_bandit_barricade_a.glb
```

Avoid:

```text
final_final_good_blacksmithTHING(2).glb
```

---

# 14. MODULAR BUILDING KIT CONTRACT

For a construction family, **consistency matters more than individual beauty**.

Use a common grid:

- 2 m horizontal wall bays
- ~2.7 m story height
- 2 × 2 m floor/foundation modules
- matching roof widths
- matching timber dimensions
- consistent plaster/wood material scale
- doors/windows aligned to the same structural grid

Every module should be shown next to the same scale figure or meter grid during concept approval.

When possible, create small **assembled test buildings** from the modules before mass-producing variants. If the pieces do not form believable architecture together, fix the kit before making 30 pieces.

---

# 15. TREE + FOLIAGE SPECIAL RULES

Trees are not ordinary props.

For hero trees:

- strong trunk silhouette
- readable branching structure
- plausible crown mass
- avoid hundreds of tiny modeled leaves
- use game-friendly leaf cards/clusters where appropriate
- generate trunk/branch geometry separately from foliage if the pipeline supports it
- create stump and fallen-log companions from the same tree family

Alderwatch gameplay needs trees to chop and fall, so source geometry must be compatible with runtime interaction. The prettiest static AI tree is useless if it cannot be sensibly separated into trunk/log/stump states.

---

# 16. WEAPONS + EQUIPMENT SPECIAL RULES

Weapons must be designed around believable dimensions and a stable hand grip.

Include intended total length and grip region in the manifest.

Examples:

- one-handed sword: roughly 0.9–1.1 m total
- hand axe: roughly 0.55–0.75 m
- bow: roughly 1.4–1.8 m depending on type

The runtime will attach them to verified hand sockets. Do not generate floating hands or characters as part of the weapon mesh.

---

# 17. LICENSE / PROVENANCE RULE

For every generated pack, record:

- generator/provider
- generation date
- account/plan or license basis if relevant
- whether the provider terms grant the commercial use we need
- any third-party source image/reference that carries its own license obligations

Do not casually mix scraped copyrighted 3D assets into a supposedly generated pack.

If a pack contains external CC0/CC-BY assets, identify them individually and preserve attribution requirements where applicable.

---

# 18. THE ACCEPTANCE GATE

An asset is **not accepted because the generator says success**.

It is accepted when:

1. GLB loads correctly.
2. Scale is sane.
3. Orientation is sane.
4. Materials respond correctly under Alderwatch lighting.
5. Geometry does not explode or create giant slabs.
6. Performance is reasonable for its role.
7. It looks coherent beside existing approved assets.
8. **The actual in-game screenshot is materially better.**

If it is technically integrated but the screenshot looks the same or worse, the art request remains open.

---

# 19. WHAT JARED SHOULD DO FIRST

Do **not** begin with 100 assets.

Do this exact sequence:

### Experiment A — generator bakeoff

Create Alderwatch references for:

- weathered barrel
- timber market stall
- mature oak

Generate each through Tripo, Meshy and Rodin. Package all nine GLBs plus the reference art. Upload them here.

We select the winning pipeline per class.

### Experiment B — first real transformation pack

After the bakeoff, make:

**ALDERBROOK VILLAGE LIFE PACK v1**

Suggested 20 assets:

- market stall A/B
- produce table
- bench A/B
- barrel A/B
- crate A/B
- basket A/B
- sack pile
- handcart
- wagon
- wood pile A/B
- chopping block
- wash tub
- hanging sign
- lantern
- planter/herb box

This pack has extremely high screenshot impact and low integration risk.

### Experiment C — UI beauty pack in parallel

Generate the complete core icon family in one locked style:

- axe
- pickaxe
- sword
- bow
- spear
- hammer
- wood
- stone
- ore
- fiber
- hide
- leather
- berries
- herbs
- venison
- cooked meat
- crow milk
- wild honey
- health
- stamina
- regen
- move speed
- damage
- warmth
- satiety

Do not bake frames into them.

---

# 20. FINAL OPERATOR CHECKLIST

Before uploading any pack, ask:

- [ ] Does this look unmistakably Alderwatch?
- [ ] Did I use the approved master style board?
- [ ] Did I approve a hero design before generating 3D?
- [ ] Are multiview images the same object, not four independent inventions?
- [ ] Is the asset adult/grounded rather than toy-like?
- [ ] Is the scale stated in meters?
- [ ] Is the model GLB?
- [ ] Are materials PBR?
- [ ] Is baked directional lighting removed from base color?
- [ ] Are textures reasonably sized?
- [ ] Is the polygon count sane or at least remeshable?
- [ ] Did I keep coherent variants/families together?
- [ ] Did I record generator/license provenance?
- [ ] Did I include preview/reference images?
- [ ] Did I ZIP the actual model files, not merely send screenshots?

If those are true: **upload the ZIP.**

---

# 21. RESEARCH BASIS / CURRENT TOOL CAPABILITIES

This workflow is grounded in the current documented capabilities of the target runtime and generation tools as of 2026-09-08:

- glTF 2.0 uses meters, +Y up and +Z forward.
- Three.js `GLTFLoader` directly supports glTF/GLB and can be configured for Meshopt, Draco and KTX2 pipelines.
- Tripo's current multiview generation supports view-labeled image conditioning and PBR GLB output.
- Meshy currently supports GLB remeshing to target polygon counts and AI PBR texturing with baked-light removal.
- Rodin currently supports multi-image same-object conditioning, PBR GLB output, target face counts and bounding-box control.

Primary references:

- Khronos glTF 2.0 specification: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
- Three.js GLTFLoader: https://threejs.org/docs/pages/GLTFLoader.html
- Tripo Multiview to 3D: https://developers.tripo3d.ai/en/docs/generation-multiview-to-model
- Meshy Remesh API: https://docs.meshy.ai/en/api/remesh
- Meshy AI Texturing: https://docs.meshy.ai/en/webapp/guides/3d-model/ai-texturing
- Hyper3D Rodin: https://docs.hyper3d.ai/en/api-specification/rodin-gen1-1-5

---

# 22. THE PRODUCTION PHILOSOPHY

Jared is the **art director and asset factory**.

The integration side is the **technical art / engine / optimization / visual QA layer**.

The fastest route to a beautiful game is not to ask the engine to procedurally invent visual quality. It is to feed the engine **coherent authored art in disciplined families**, then make the runtime place, light, animate, optimize and reuse it intelligently.

We should be able to repeat this loop indefinitely:

**ART DIRECT → GENERATE → PACKAGE → UPLOAD → INTEGRATE → PLAY → SCREENSHOT → REJECT/KEEP → GENERATE NEXT PACK.**

That loop is now the canonical Alderwatch art-production pipeline.
