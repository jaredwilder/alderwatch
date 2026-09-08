# Alderwatch workspace

This is the user's medieval survival/action RPG vertical slice, not the earlier Blender connection/axe test. The canonical product specification is `GAME_VISION.md`; the concrete first-slice objective is `VERTICAL_SLICE.md`. Read both completely when recovering task context.

Keep this project separate from the neighboring `woocommerce-enterprise` repository. Do not modify that repository for game work.

Continue from authoritative source and browser evidence. Never mark the game complete merely because a build or unit test passes. Animation, equipment hand sockets, gathering, world composition, building, combat, cooking, persistence and actual screenshot comparison remain release gates.

Use the existing Vite server on port 5190 when live; verify its session before starting another. Assets are authored through Blender MCP and exported into `public/assets`. Preserve anatomical hand sockets, material identities, UVs and authored vertex colors during optimization.

Check `DEVELOPMENT_STATE.md` for the latest verified checkpoint and gaps. It is a checkpoint, not a replacement specification.

`GAME_REQUEST_LEDGER.md` is the running player-facing request contract. Update it whenever Jared makes a concrete game request, preserve explicit "on top of / not instead" constraints, and do not mark a request SHIPPED until the implemented behavior survives tests/build and the relevant live/deploy gate. A technically integrated visual change that does not materially change the live screenshot remains open.

`docs/INTEGRATION_INTEGRITY.md` is the branch/work preservation ledger. Read it before rebasing, force-updating, closing, replacing, or deleting a stale feature branch. Never assume that an old/conflicted branch is disposable. Classify its changes as already contained, superseded, intentionally abandoned, or unique work still owed. Never merge a stale branch wholesale over current integration files: forward-port the intended slice onto current `main`, run the full repository tests/build, merge with an expected-head SHA guard, and verify the post-merge CI/deploy gate. Do not delete a branch that still contains unique work unless this ledger records exactly where that work landed or why it was intentionally killed.
