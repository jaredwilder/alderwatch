# Terrain hotfix note

The live ground path is intentionally conservative after the regional orange/bleached terrain regressions.

`src/ground-material.ts` currently uses only the authored meadow albedo plus terrain vertex macro tint. The existing `soilMix` geometry attribute remains available for future terrain work but is not consumed by the live material.

Do not reintroduce `onBeforeCompile` terrain palette logic directly on `main`. Future road/soil/forest-floor work should be visually validated in-game from representative regions before merge.
