# ALDERWATCH AI ART PRODUCTION RUNBOOK

**Purpose:** This is the operator work order for Jared to create Alderwatch art in parallel with game development.

**Rule:** Follow the steps in order. Do not skip ahead. A later step may only use an input that an earlier step explicitly created.

**Canonical status:** If casual chat advice conflicts with this file, this file wins until we deliberately revise it.

---

# PHASE 1 — LOCK THE VISUAL LANGUAGE

## STEP 1 — Create the Alderwatch Master Style Board

Create **one image** called:

`alderwatch_master_style_board_v1.png`

Use your best image generator.

### Prompt

> ALDERWATCH MASTER STYLE BOARD. Adult grounded medieval frontier fantasy for a commercial third-person survival action RPG. Bright readable daylight. Rich natural color. Stylized hand-painted PBR, not photorealistic. Show a coherent material and shape-language board containing: weathered oak, rough-sawn pine, whitewashed lime plaster, irregular fieldstone, worn hand-forged iron, aged steel, brown vegetable-tanned leather, undyed linen, dirty natural wool, straw/thatch, moss, damp mud, soot and ash. Include examples of thick load-bearing timber, visible joinery, plausible roof construction, heavy practical doors, hand-forged hardware, modest medieval ornament, asymmetric handmade construction, believable adult proportions, market clutter, workshop clutter and frontier survival objects. Palette: warm brown wood, cream plaster, charcoal iron, moss/fern greens, straw ochres, muted linen colors, restrained rust reds, cold gray stone, blue daylight sky. Weathering is restrained and believable: rain streaks, ground-level mud, soot near fires, split timber, mild oxidation, moss only where moisture makes sense. NOT chibi. NOT voxel. NOT Minecraft. NOT low-detail mobile fantasy. NOT Fisher-Price. NOT plastic. NOT giant-headed. NOT ornate palace fantasy. NOT steampunk. NOT photoreal scan. NOT baked cinematic lighting.

### Acceptance gate

Do **not** proceed until the board looks like one coherent game rather than a collage of unrelated styles.

Reject it if any of these are true:

- toy-like proportions
- plastic materials
- excessive fantasy ornament
- cartoon/chibi people
- unrelated architectural styles
- photorealism
- dark grim-brown lighting instead of readable daylight

When approved, freeze that exact image as **v1**. Do not keep regenerating it during the first asset test.

**OUTPUT OF STEP 1:**

`alderwatch_master_style_board_v1.png`

---

## STEP 2 — Create the three benchmark hero references

Using `alderwatch_master_style_board_v1.png` as the style reference, create exactly three individual hero-reference images:

1. `benchmark_barrel_hero.png`
2. `benchmark_market_stall_hero.png`
3. `benchmark_mature_oak_hero.png`

These three objects deliberately test easy, architectural, and organic generation.

### 2A — Barrel prompt

> ALDERWATCH WEATHERED BARREL. One practical medieval coopered oak barrel, approximately 0.9 meters tall, iron hoops, believable construction, subtle wear, grounded adult medieval frontier design, stylized hand-painted PBR, natural materials, neutral daylight, entire object visible, simple neutral background. Use the attached Alderwatch Master Style Board as the visual language. NOT cartoon, chibi, voxel, plastic, ornate fantasy, steampunk, photoreal product photography or cinematic scene lighting.

### 2B — Market-stall prompt

> ALDERBROOK TIMBER MARKET STALL. One freestanding medieval frontier market stall approximately 3 meters wide, 2 meters deep and 2.6 meters tall. Weathered structural timber, believable joinery, linen or wool awning, practical counter and shelving, readable adult medieval proportions, subtle handmade asymmetry, stylized hand-painted PBR, neutral daylight, entire structure visible, simple neutral background. Use the attached Alderwatch Master Style Board as the visual language. NOT cartoon, chibi, voxel, plastic, ornate high fantasy, steampunk or photoreal.

### 2C — Mature-oak prompt

> ALDERWATCH MATURE OAK. One large believable frontier oak approximately 14 to 16 meters tall, broad irregular crown, massive old trunk, visible roots, natural branching, gameplay-readable silhouette, grounded stylized hand-painted PBR, rich natural bark and leaf color, neutral daylight, whole tree visible, simple neutral background. Use the attached Alderwatch Master Style Board as the visual language. NOT tiny toy tree, spherical canopy, voxel, plastic, fantasy glowing tree or photoreal scan.

### Acceptance gate

Approve **one exact design** for each object.

Do not proceed until each image clearly belongs to the same Alderwatch visual world.

**OUTPUTS OF STEP 2:**

- `benchmark_barrel_hero.png`
- `benchmark_market_stall_hero.png`
- `benchmark_mature_oak_hero.png`

---

## STEP 3 — Create multiview sheets for those exact three objects

For each approved hero image from Step 2, use image-reference/editing mode to generate the **same exact object** from multiple views.

Create:

- `benchmark_barrel_turnaround.png`
- `benchmark_market_stall_turnaround.png`
- `benchmark_mature_oak_turnaround.png`

Each turnaround must contain:

- FRONT
- LEFT
- BACK
- RIGHT

Optional: one 3/4 view for human inspection only.

### Turnaround prompt

> Create a production 3D asset turnaround of the EXACT SAME OBJECT shown in the attached approved hero reference. Show FRONT, LEFT, BACK and RIGHT views. Orthographic or near-orthographic. Identical proportions, construction, materials and details in every panel. Same scale in every panel. Neutral mid-gray background. Flat soft neutral illumination. Entire object visible. No environmental props. No perspective drama. No depth of field. No new design changes. No text except tiny FRONT / LEFT / BACK / RIGHT labels.

### Acceptance gate

Reject a turnaround if the views disagree about:

- silhouette
- number or placement of structural pieces
- roof shape
- barrel hoops
- branch structure
- proportions
- material identity

**OUTPUTS OF STEP 3:**

- three approved turnaround sheets

---

# PHASE 2 — CHOOSE THE 3D PIPELINE EMPIRICALLY

## STEP 4 — Generate the three benchmarks in Tripo

Use the Step 3 multiviews as the input.

For each asset:

- use multiview / same-object image-to-3D
- enable textures
- enable PBR if offered
- export GLB
- preserve UVs
- do not intentionally bake dramatic directional lighting

Export:

- `barrel_tripo.glb`
- `market_stall_tripo.glb`
- `mature_oak_tripo.glb`

Do not judge final quality only from Tripo's beauty render.

**OUTPUT OF STEP 4:** three GLBs.

---

## STEP 5 — Generate the same three benchmarks in Meshy

Use the same approved Step 3 reference material.

For each asset:

- generate/reconstruct the same object
- remesh if needed
- use PBR maps
- use Remove Lighting if available
- export GLB

Export:

- `barrel_meshy.glb`
- `market_stall_meshy.glb`
- `mature_oak_meshy.glb`

**OUTPUT OF STEP 5:** three GLBs.

---

## STEP 6 — Generate the same three benchmarks in Rodin

Use the same approved Step 3 multiview references.

For each asset:

- treat all views as the same object
- request PBR materials
- export GLB
- use bounding-size control if available
- keep physical scale close to the dimensions specified in Step 2

Export:

- `barrel_rodin.glb`
- `market_stall_rodin.glb`
- `mature_oak_rodin.glb`

**OUTPUT OF STEP 6:** three GLBs.

---

## STEP 7 — Package the benchmark bakeoff

Create this exact folder:

```text
alderwatch_3d_bakeoff_v1/
  references/
    alderwatch_master_style_board_v1.png
    benchmark_barrel_hero.png
    benchmark_barrel_turnaround.png
    benchmark_market_stall_hero.png
    benchmark_market_stall_turnaround.png
    benchmark_mature_oak_hero.png
    benchmark_mature_oak_turnaround.png
  models/
    barrel_tripo.glb
    barrel_meshy.glb
    barrel_rodin.glb
    market_stall_tripo.glb
    market_stall_meshy.glb
    market_stall_rodin.glb
    mature_oak_tripo.glb
    mature_oak_meshy.glb
    mature_oak_rodin.glb
  README.md
```

Put this in `README.md`:

```md
# Alderwatch 3D Bakeoff v1

Barrel intended height: 0.9 m
Market stall intended size: 3.0 m W × 2.0 m D × 2.6 m H
Mature oak intended height: 14–16 m

All models were generated from the same approved Alderwatch references.

Generator/account license status:
- Tripo: [fill in]
- Meshy: [fill in]
- Rodin: [fill in]
```

Zip the folder as:

`alderwatch_3d_bakeoff_v1.zip`

Upload that ZIP to this chat.

### STOP GATE

**STOP HERE. Do not mass-produce 3D assets yet.**

I will inspect all nine models, normalize them, test them in the actual game and tell you which pipeline wins for:

- props
- architecture
- organic/nature assets

That decision becomes the production generator assignment.

---

# PHASE 3 — START REAL PRODUCTION AFTER THE BAKEOFF

Do not begin this phase until I return the bakeoff result.

## STEP 8 — Freeze the generator assignment

After I evaluate the bakeoff, record the result at the top of your working notes:

```text
PROP GENERATOR = [winner]
ARCHITECTURE GENERATOR = [winner]
NATURE GENERATOR = [winner]
CLEANUP/REMESH TOOL = [winner or none]
```

Use those assignments until we deliberately run a new bakeoff.

---

## STEP 9 — Produce Alderbrook Village Life Pack v1

Generate this exact first production pack:

1. large weathered barrel
2. small barrel
3. wooden crate
4. lidded crate
5. grain sack
6. produce basket
7. bucket
8. chopping block
9. split-firewood stack
10. long timber bench
11. small stool
12. hand cart
13. two-wheel goods cart
14. laundry line with cloth
15. wooden shop sign blank
16. wall lantern
17. planter/herb box
18. wood rack
19. rain barrel
20. roadside notice board

For **each** asset, execute Steps 10–13 below before moving to the next asset.

---

## STEP 10 — Make the production hero reference

For the asset you are currently making:

1. attach `alderwatch_master_style_board_v1.png` as the style reference
2. generate one clean hero reference
3. show the entire object
4. use neutral daylight
5. use a plain neutral background
6. specify real dimensions in the prompt
7. approve one design

Save it as:

`references/[asset_name]_hero.png`

Do not generate 3D until that exact hero design is approved.

---

## STEP 11 — Make the production turnaround

Use the Step 10 hero image as the identity reference.

Generate FRONT / LEFT / BACK / RIGHT of the exact same object using the Step 3 turnaround prompt.

Save it as:

`references/[asset_name]_turnaround.png`

Do not proceed if the views disagree structurally.

---

## STEP 12 — Generate the production GLB

Use the generator assigned to that asset class in Step 8.

Required handoff:

- glTF 2.0 GLB
- meters
- +Y up
- +Z forward
- bottom of object at or near origin
- real-world scale
- UVs
- PBR metallic/roughness workflow
- base color
- roughness
- normal map
- metallic only where appropriate
- no directional sunlight baked into albedo

### Triangle targets

- tiny clutter: 300–1,500
- barrel/crate/chair/bucket: 1,000–4,000
- weapon/tool: 2,000–6,000
- cart/stall/large prop: 3,000–10,000
- ordinary tree: 3,000–10,000
- hero mature tree: 8,000–20,000
- modular building piece: 1,000–6,000
- important complete building: roughly 15,000–40,000

### Texture targets

- tiny clutter: 512 px
- normal props: 1K
- hero props/trees/buildings: 2K
- do not use 8K textures

Save as:

`models/[asset_name].glb`

---

## STEP 13 — Record the asset metadata

For every finished GLB, add one record to `asset-manifest.json`:

```json
{
  "id": "alderbrook_large_barrel_v1",
  "file": "models/alderbrook_large_barrel_v1.glb",
  "generator": "TRIPO_OR_MESHY_OR_RODIN",
  "license": "GENERATED_ASSET_LICENSE_STATUS",
  "dimensions_m": [0.7, 0.9, 0.7],
  "hero_reference": "references/alderbrook_large_barrel_v1_hero.png",
  "turnaround_reference": "references/alderbrook_large_barrel_v1_turnaround.png"
}
```

Do not omit dimensions or license status.

---

## STEP 14 — Package and upload Alderbrook Village Life Pack v1

Package:

```text
alderbrook_village_life_v1/
  references/
    alderwatch_master_style_board_v1.png
    ...all hero references...
    ...all turnarounds...
  models/
    ...all GLBs...
  asset-manifest.json
  README.md
```

Zip as:

`alderbrook_village_life_v1.zip`

Upload it to this chat.

### STOP GATE

Stop generating more village assets until I integrate this pack and we look at Alderbrook in the actual game.

If the screenshot does not materially improve, we revise the pack before generating fifty more assets in the wrong direction.

---

# PHASE 4 — CONTINUE PACK BY PACK

After Alderbrook Village Life Pack v1 is integrated and visually accepted, produce packs in this order:

## STEP 15 — Market Pack

Generate:

- merchant counter
- weighing scale
- produce crates
- hanging goods
- awning variants
- coin chest
- fabric rolls
- basket stacks
- trade sign family
- merchant stool
- price slate/sign blank
- small lockbox

Integrate and visually accept before proceeding.

---

## STEP 16 — Blacksmith Pack

Generate:

- forge
- anvil
- bellows
- quench barrel
- coal bin
- hammer rack
- tongs
- weapon blanks
- ingot stack
- grinding wheel
- smithing table
- scrap-metal pile

Integrate and visually accept before proceeding.

---

## STEP 17 — Hunter / Fletcher Pack

Generate:

- bow rack
- arrow bundles
- quiver rack
- hide frame
- tanning rack
- trap family
- antler trophy
- target butt
- skinning table
- hunting stool
- trophy wall pieces

Integrate and visually accept before proceeding.

---

## STEP 18 — Woodcutter Pack

Generate:

- saw bench
- splitting block variants
- large log stacks
- timber sled
- axe rack
- lumber cart
- simple wood shed
- wedge pile
- saw rack

Integrate and visually accept before proceeding.

---

## STEP 19 — Farm Pack

Generate:

- trough
- hay stacks
- produce baskets
- farm cart
- scarecrow
- hand tools
- grain sacks
- feed bins
- fence variants
- simple field storage

Integrate and visually accept before proceeding.

---

## STEP 20 — Frontier / Outlaw Camp Packs

Create two visually related but distinct packs.

Frontier camp should look practical and survivable.

Outlaw camp should look stolen, improvised and hostile.

Both should include:

- shelters
- bedrolls
- cook gear
- supply piles
- barricades
- weapon storage
- crates
- trophies / personal clutter

Integrate and visually accept each pack.

---

## STEP 21 — Road / Ruin Pack

Generate:

- milestones
- shrines
- broken carts
- grave markers
- collapsed masonry
- abandoned fire pits
- ruined fence sections
- abandoned packs
- roadside memorials

Integrate and visually accept.

---

## STEP 22 — Nature Families

Do not create one-off trees.

Create complete families.

### Oak family

- mature oak A/B/C
- young oak A/B
- dead oak
- stump A/B
- fallen trunk A/B
- chopped log A/B/C

Then repeat the family method for any additional tree species.

Also create coherent families for:

- rocks
- mushrooms
- bushes
- flowers
- wetland plants

Integrate and visually accept each family.

---

# PHASE 5 — UI / ICON ART

This lane may begin **after Step 1 is approved**, because it only needs the Master Style Board and does not depend on the 3D bakeoff.

## STEP 23 — Create the canonical item-icon camera/style sample

Using the Master Style Board as the style reference, generate exactly six sample icons:

- axe
- bow
- grilled venison
- wood
- iron ore
- crow milk

Use this prompt:

> ALDERWATCH INVENTORY ICON — [ITEM]. One centered medieval game item on transparent background. Grounded adult frontier aesthetic. Slightly painterly hand-painted PBR illustration. Natural material detail. Strong readable silhouette at 48–64 px. Consistent 3/4 camera. Soft neutral key light only. No text. No UI border baked into the image. No environment. No hands. NOT cartoon, chibi, mobile-game candy art, voxel, neon, photoreal catalog photography or ornate high fantasy. Use the attached Alderwatch Master Style Board for material and palette language.

Generate at 512×512 or 1024×1024 with transparency.

### Acceptance gate

Do not generate the full icon library until all six look like the same artist made them.

---

## STEP 24 — Generate the first complete icon set

After the six-sample icon style is approved, generate these in that exact style:

### Tools / weapons

- axe
- pickaxe
- sword
- bow
- hammer
- spear when available

### Resources

- wood
- stone
- fiber
- hide
- leather
- iron ore
- coal
- herbs
- clay
- antlers
- crow crop
- honey

### Food

- grilled venison
- berries
- cooked meat
- stew
- crow milk
- wild honey

### Buff / character

- health
- stamina
- health regeneration
- movement speed
- damage
- armor
- warmth
- satiety
- karma
- fame
- reputation

Save as transparent PNG files with no baked UI frame.

Upload them as one ZIP.

---

# PHASE 6 — HUMANS AND ANIMALS

## STEP 25 — Do not replace the player/NPC skeleton with random generated characters

The live game already has an adult survivor skeleton, locomotion, combat animation and verified hand socket behavior.

For human art, generate/reference-design these instead:

- clothing sets
- armor sets
- helmets
- cloaks
- backpacks
- belts
- pouches
- hairstyles
- shields
- weapons
- NPC portraits

Any wearable model intended for gameplay must ultimately be conformed to the existing humanoid rig. Do not assume a random generated rig can replace it.

---

## STEP 26 — Treat each animal species as its own production family

For a species upgrade:

1. create the species hero reference using the Master Style Board
2. create matching multiviews
3. generate one approved base mesh
4. do not generate ten unrelated specimens
5. preserve one rig/animation family once the species is working
6. create visual variants by texture/material/proportion changes around that approved family

Do not replace a working animal rig just because another generator makes a prettier static preview.

---

# FINAL OPERATOR CHECKLIST

Before uploading any production pack, verify all of these:

- [ ] Step 1 Master Style Board is included or referenced
- [ ] every 3D asset has an approved hero reference
- [ ] every important 3D asset has a consistent turnaround
- [ ] every model is GLB
- [ ] dimensions are stated in meters
- [ ] origin/grounding is sensible
- [ ] no obvious baked directional lighting
- [ ] textures are not absurdly large
- [ ] models are not absurdly dense
- [ ] asset names are unique and descriptive
- [ ] generator provenance is recorded
- [ ] license/commercial-use status is recorded
- [ ] `asset-manifest.json` is included
- [ ] ZIP contains actual models, not only screenshots

---

# WHAT TO DO RIGHT NOW

Do only these actions now:

1. Complete **STEP 1** and freeze `alderwatch_master_style_board_v1.png`.
2. Complete **STEP 2** for barrel, market stall and mature oak.
3. Complete **STEP 3** for those same three objects.
4. Complete **STEPS 4–6** to create nine GLBs.
5. Complete **STEP 7** and upload `alderwatch_3d_bakeoff_v1.zip` here.
6. Stop.

While the 3D bakeoff is processing, you may independently complete **STEP 23** and send me the six sample inventory icons.

Everything after that waits for in-game acceptance of the bakeoff.
