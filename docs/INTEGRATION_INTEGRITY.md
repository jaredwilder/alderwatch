# Alderwatch integration integrity ledger

This file exists because Alderwatch is developed by many parallel sessions and a stale branch can contain good work even when its implementation is no longer safe to merge wholesale.

**Rule:** never equate `old`, `conflicted`, or `behind main` with `discardable`.

## Integration protocol

For any branch that is behind `main`:

1. Compare its intended changed files against current `main`.
2. Classify each change as **already contained**, **superseded by a newer implementation**, **intentionally abandoned**, or **unique work still owed**.
3. Never resolve a stale branch by overwriting current integration files wholesale.
4. Forward-port the exact intended slice onto the newest `main` tree.
5. Run the full repository test suite and production build on that combined tree.
6. Merge with an expected-head SHA guard.
7. Treat the post-merge `main` CI and, for live-facing changes, the production deploy/live probe as the authoritative gate.
8. Do not delete a branch containing unique work until this ledger records where that work landed or why it was intentionally killed.

## Current protected work

### PR #79 — melee timing / axe arc

Branch: `chatgpt/melee-timing-axe-arc`  
Protected head at audit: `7ab574d0368a7d61207e1582f420528514f92519`

Status: **UNMERGED BY DESIGN — PRESERVE.**

This is measured combat-animation timing work. Its own PR explicitly requires live visual acceptance before merge. Do not auto-merge it during a generic cleanup sweep and do not delete or force-reset its branch. When Jared accepts the visuals, forward-port its seven-file combat/test slice onto then-current `main`, rerun full CI, and merge the exact tested head.

### `fix/core-gameplay-runtime-parity`

Protected head at audit: `27499968346b5ad40bf5f64b49c89b480ec83414`

Status: **UNIQUE WORK — NOT YET INTEGRATED.**

Unique files:

- `src/area-gameplay-shell.ts`
- `src/area-gameplay-shell.css`

This is a shared cross-area survivor HUD/menu/map shell intended to make streamed realms retain Pack / Map / Journal / Recipes / food / 1–5 gear behavior without mutating Far March coordinates. It has no current consumer on `main`, so blindly merging two dormant files would not finish the feature. Preserve the branch until an area-runtime pass wires it into Ironward/Crownroad/Deep Iron with tests.

### `mega-overnight-world-boss-backpack`

Status: **PARTIALLY HARVESTED; NEVER MERGE WHOLESALE.**

This branch is hundreds of commits behind modern `main`. Valuable work has already been recovered into current architecture:

- five named giants/world bosses → recovered in PR #59;
- backpack/runtime UI startup → superseded by the current Backpack/UI bootstrap and hardened again by PR #83;
- save/runtime-shape safety intent → superseded by the explicit save compatibility path in PR #82;
- current rare-beast/quality/legend systems evolved substantially in later merged work.

Still unique and therefore **owed / preserved**:

- deterministic weapon-affix prototype in `src/item-affixes.ts` (`Keen`, `Hunter’s`, `Ironward`, `Marchwarden’s`, humorous suffixes, bounded damage bonuses);
- authored outer-region content concepts in `src/world-expansion.ts`: **Greymoor, Wolfpine, Blackfen, Giant’s Step, Stonewake** plus their named camps/rest sites/wildlife placements.

Do not revive the old coordinate-expansion implementation: it predates the current addressable/streamed realm architecture. Forward-port the affix design into current loot/equipment systems and migrate the named regions/sites into the realm-address/content pipeline instead.

## Explicitly accounted historical branches

- `feat/painted-kling-item-icons` → forward-ported onto current main and merged as PR #85.
- `feat/painted-inventory-icons` → fully contained in current main at audit time.
- `feat/causal-realm-convergence-current` → fully behind current main; later causal/provenance implementations supersede it.
- `feat/provenance-frontier-court` / `feat/provenance-frontier-court-v2` → concepts and filenames are present in substantially evolved current provenance/social code and tests; do not restore the older files.
- `feat/simulated-players`, `feat/sim-player-society`, and early social-separator branches → superseded by the merged current simulated-player/society/social-separator stack.
- `fix/wildlife-distribution-v2` → superseded by the later merged wildlife distribution pass (#49).
- `chatgpt/ui-item-art-pass` → superseded by the current item-icon/runtime UI stack.
- `chatgpt/combat-orientation-leg-hotfix` → superseded by later combat hotfix/polish iterations.
- closed PR #42 → superseded by #43; its failed manual GLB-transfer experiment is intentionally dead.
- closed PR #78 → stale villager implementation; safely forward-ported and merged as #84.
- closed PR #81 → duplicate of the merged realm-consequence TypeScript repair #80.
- `art-authored-barrel` → intentionally abandoned binary-transfer experiment. Preserve history, but do not resurrect the manual chunk-upload workflow.

## What “not lost” means

A branch being preserved is not the same as its feature being shipped. The statuses above are deliberately explicit:

- **merged/current** means the intended behavior or asset exists in current architecture;
- **superseded** means a newer implementation owns the same concern;
- **unique work / owed** means its commit is protected but it still needs a proper current-main forward-port;
- **intentionally abandoned** means the decision to kill it is itself recorded so future sessions do not waste time reviving it.

When new parallel work appears, add it here if it remains unmerged at the end of a session or if a replacement PR closes an older one.