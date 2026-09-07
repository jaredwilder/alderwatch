# Alderwatch: external handoff for regular ChatGPT Sol (High)

Repository: https://github.com/jaredwilder/alderwatch
Prepared: 2026-09-07. User intends regular ChatGPT, Sol, High reasoning, with GitHub plugin already connected.

## Paste this into the new ChatGPT conversation

Continue my existing game Alderwatch in @GitHub jaredwilder/alderwatch. Use Sol with High reasoning (I select this in the UI); stay in regular ChatGPT unless I explicitly request otherwise.

This is an existing playable Three.js + Rapier + Vite / TypeScript medieval survival action RPG, NOT a request to start over, reconnect Blender, build a single axe, or work on WooCommerce.

First read HANDOFF_CHATGPT.md and README.md from the actual repository. Read AGENTS.md, GAME_VISION.md, VERTICAL_SLICE.md fully once; then the newest section of DEVELOPMENT_STATE.md and only source files relevant to the task. Older checkpoint sections are historical and can contradict today's implementation.

Before promising changes, check which GitHub tools you actually have: repository reads, branch/file writes, commits and PRs. Do not assume the plugin provides a shell, browser, Blender, or access to my computer. If branch/file writes are available, use a focused branch and PR for each requested improvement. If unavailable, provide a small applicable unified diff against the actual files, with commands I can run locally. Never claim code was edited, tested, pushed or visually checked without evidence. Do not merge PRs without my approval. Do not ask me to buy tools or switch to paid Work just to continue.

Priorities: beautiful grounded ADULT medieval art, readable daylight, believable full-sized characters/trees/buildings; fun exploration and satisfying mobile combat; Diablo-like elevated camera. Absolutely no Minecraft/voxel/toy look. Preserve the approved ferns. Reuse the approved art set before requesting more image generation. Preserve movement during attacks, accepted mouse inversion on BOTH axes, free mouse look (no held-right-click camera), zoom, verified hand sockets and existing saves.

I want useful implementation, not another long plan. Keep tokens efficient: one coherent improvement per task, targeted reading, no broad refactor or repetitive status dumps. Inspect before changing; show the actual diff; distinguish automated tests from visual/playtesting evidence. Ask me what feature to tackle if I have not supplied one.

## Verified handoff baseline

- Adult rigged survivor and authored equipment, environment, wildlife GLBs already ship under public/assets. No Blender installation is needed to run the game or change gameplay code.
- Gathering: multi-hit trees/rocks, physical falling trees and loose manual pickups.
- Crafting, cooking buffs, inventory/storage, snap building, doors, shelter and persistence exist; full opening-ten-minute polish is not accepted.
- Moving light attacks preserve walking; light sprint cap 4.3m/s; heavy movement 2.7m/s. Aim assistance, wider reach, held-click chaining and slower pursuers address earlier user complaints. Do not reinstate stationary swings.
- Camera: elevated ~55 degrees, 14m default distance, 42-degree FOV, wheel zoom 7–24m, foreground-tree cutaway. Both inversion signs were accepted by the user.
- Camera-oriented minimap and gold tracked-objective bearing. J/M opens journal; track destinations there.
- Ash Road expedition, two finite bounty contracts, camp guards and real one-time loot.
- Finite 768x768m realm with saved seed, Southwood/Ironward/Briar regions, six procedural sites, nearby resource/vegetation streaming, ambient hare/crow and forage. This is NOT infinite terrain or newly randomized legacy terrain heights. Existing resources/buildings/dead enemies/looted containers must remain authoritative.
- Last gameplay checkpoint: 78/78 tests passed and build passed. See repository handoff verification for fresh results. No claim of concept-art parity, sustained 1080p 60FPS, complete perimeter exploration, or full manual camp/house acceptance.
- Known gaps: art still below reference, geometry batching color/gpuType warnings, ~3MB JS bundle warning, incomplete broad product vision. Multiplayer is not implemented.

## Where to work

- State/persistence: src/state.ts; definitions/economy: src/definitions.ts, src/economy.ts.
- Runtime/UI: src/main.ts, src/game-panels.ts, src/style.css.
- Input/camera/character: src/input.ts, src/follow-camera.ts, src/character.ts.
- Combat: src/combat-rules.ts, src/combat.ts; quests: src/expedition.ts, src/bounties.ts.
- World: src/worldgen.ts, src/frontier-renderer.ts, src/landscape.ts, src/terrain.ts, src/ecology.ts, src/nature.ts.
- Navigation/building/gathering: src/minimap.ts, src/building.ts, src/structure-geometry.ts, src/gathering.ts.
- Visual targets: art/concepts/hero.png, gathering.png, settlement.png; approved coordinated set: art/direction-v2/.
- Actual last frontier capture: art/captures/procedural-southwood.png. Concept images are targets, not gameplay evidence.

## Run and verify

Node 22.12+; npm ci; npm test; npm run build; npm run dev.
Dev URL http://127.0.0.1:5190/ belongs to the machine running Vite, not automatically the ChatGPT cloud.
CI runs tests/build for pushes and PRs. Check the actual run conclusion; a workflow file existing is not a passing run.

Use /?rehearsal=frontier (or nature/combat/house/expedition) only on the dev server for isolated NOT SAVED testing. Never test by overwriting my normal browser save. Normal world is in localStorage key alderwatch.realm.v1; settings and backup are also browser-local. GitHub does not transfer my save. Keep the same local origin/port for my existing progress.

## Asset and tool boundaries

The repo ships ready-to-use GLBs/WebPs, source textures, references and authoring scripts. Large assets/source/ Blender files, raw GLBs, third-party archives and extraction folders stay LOCAL and are intentionally ignored. They are not deleted or backed up by this GitHub push. Asset regeneration scripts require that local source and include workstation-specific paths; do not run them blindly from a fresh clone. scripts/export_character.py is historical, not the current safe character-export path.

No credential or local MCP configuration is needed for normal code changes. Do not request API keys, expose Blender's socket publicly or assume previous Codex browser/Blender session IDs are usable here. If a needed image cannot be inspected through GitHub, ask me to attach that specific image. If visual testing is unavailable, say so and give me a short local playtest checklist.

GitHub plugin actions depend on the current chat's tools and granted permissions. Official context: https://learn.chatgpt.com/docs/plugins

