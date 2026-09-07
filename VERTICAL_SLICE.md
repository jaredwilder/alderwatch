GOOD. SETUP TEST DONE. NOW LETS GET SERIOUS. BUILD THIS ONE LEVEL UP FROM THE REPO THIS HAS NOTHING TO DO WITH OUR REPO



NOW. ITS GAME TIME!!!



Read GAME\_VISION.md completely. It is the canonical product specification and north star. Do not simplify its visual standard or reinterpret it as a tech demo.

Your job is to BUILD THE FIRST COMMERCIAL-QUALITY VERTICAL SLICE.

You have Blender MCP and image generation available. USE THEM.

The biggest failure mode is generic AI-game visuals. Prevent that with a closed visual development loop.

FIRST: ART-DIRECT THE GAME BEFORE BUILDING IT.

Use image generation to create a small coherent concept-art package for this exact game:

1. Hero gameplay view: adult medieval survivor standing in a beautiful daylight frontier forest/meadow, large believable trees, distant mountains, stone road, timber structures, natural rich color, stylized hand-painted PBR, grounded adult medieval aesthetic.
2. Gathering view: same character and same art direction chopping a huge mature tree with a properly held iron axe, visible impact debris, felled logs physically present.
3. Settlement view: a small player-built timber house/workbench/palisade area in the same world.

These images become the TARGET.

Do not merely admire them.

BUILD TOWARD THEM.

Use Blender MCP aggressively to create proper authored game assets, modular asset families, materials, equipment, foliage, structures, weapons, props and environment pieces.

Prefer reusable modular kits over unrelated one-off meshes.

For the browser runtime use a production-sensible architecture. Prefer Three.js + Rapier + Vite unless the existing repository already contains a stronger compatible implementation.

Blender is the asset-authoring pipeline. Export optimized GLB assets into the game.

BUILD A POLISHED VERTICAL SLICE containing:

cinematic title screen\
→\
character/archetype selection\
→\
beautiful daylight spawn\
→\
excellent third-person movement\
→\
sprint / turn / dodge\
→\
equip properly socketed axe\
→\
chop a LARGE animated tree\
→\
tree falls physically\
→\
logs remain in world\
→\
manually collect logs\
→\
mine a rock\
→\
craft a sword\
→\
fight one credible bandit\
→\
cook one food item\
→\
receive a meaningful food buff\
→\
place foundations/walls/roof\
→\
construct a small attractive house\
→\
place workbench\
→\
loot a tiny nearby enemy camp\
→\
return home

Do not substitute primitive cubes/cylinders for final visible assets in this slice.

Do not sacrifice movement, animation, character quality, hand/socket attachment correctness, gathering feel, lighting, world composition or building quality.

REDUCE MAP SIZE AND CONTENT COUNT FIRST.

After every major visual milestone:

RUN THE GAME.\
CAPTURE ACTUAL IN-GAME SCREENSHOTS.\
COMPARE THEM AGAINST THE APPROVED CONCEPT ART.\
IDENTIFY THE LARGEST VISUAL MISMATCHES.\
FIX THEM.\
RUN AGAIN.

Continue this visual repair loop rather than stopping after the first technically functional result.

Target stable 60 FPS on a normal desktop browser at 1080p.

Continuously profile the scene. Use sensible polycounts, LOD where appropriate, instancing, compressed textures/GLBs, culling, batching and limited postprocessing.

Animation is a release blocker.

Characters must have believable adult proportions and skeletal idle/walk/run/sprint/attack/tool animations.

Feet must correspond reasonably to movement.

Weapons and tools MUST follow verified hand bones/sockets. Never attach equipment to the root, pelvis, body center or an arbitrary fallback merely to make it visible.

Separate authoritative game state from presentation and use stable entity IDs so inventory, containers, structures, enemies, resources and players are not architecturally tied to one local player. We are not implementing fake multiplayer now; we are refusing to paint ourselves into a single-player-only architecture.

DO NOT spend most of the run writing plans or documentation.

Inspect.\
Generate.\
Model.\
Code.\
Run.\
Look.\
Compare.\
Repair.\
Play.\
Repair again.

The completion criterion is not “features exist.”

The completion criterion is:

THE OPENING TEN MINUTES FEEL LIKE THE BEGINNING OF A REAL INDIE SURVIVAL RPG AND THE ACTUAL GAMEPLAY SCREENSHOTS ARE VISUALLY CLOSE TO THE TARGET CONCEPT ART.

Do not ask routine questions. Make strong decisions yourself.

Begin.