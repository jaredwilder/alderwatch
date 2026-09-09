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

## Rapid-merge audit — 2026-09-09

Audit window: the large merge burst beginning after the Alderwatch master-mission checkpoint and covering PRs #91 through #105.

Result: **no wholesale feature-tree loss found.** Comparing the checkpoint to audited current main showed the repository moving strictly forward with no removed files in the recent feature set. The current boot chain still composes dev tools, streamed-area route/chat surfaces, observer-detail graphics layers, core UI, simulated-player society, conversation banks and world bosses rather than replacing one subsystem with another.

Verified current survivors include:

- dev console + Ironward arrival gate from #91/#98, later expanded by #105;
- Greyhaven household-memory barter from #92;
- provenance-bound crime knowledge from #93;
- cross-area survivor shell from #94, extended into Gatewatch by #101 and repaired for M-key map ownership by #105;
- expanded conversation/persona bank from #95;
- observer-detail / grass / material research chain #96/#97/#100/#103/#104;
- image-generated HD bark from #102;
- persistent realm road/chat surfacing from #99;
- streamed cell-boundary correctness and every current realm surfaced in dev tools from #105.

Two composition issues were found instead of hidden:

1. **HD bark vs screen-space material bandwidth.** The #102 bark wrapper was clearing the bark material's normal and roughness maps after #104 installed bandwidth-limited relief/roughness sampling. This audit branch repairs the composition: the HD generated image owns bark colour, while the existing normal/roughness maps remain available to the #104 shader. A source-level Court prevents those maps from being nulled again.
2. **Parallel conversation-bank race.** `feat/chat-bank-chaos-expansion` was created in parallel while the larger #95 conversation-bank PR landed first. Its unique lines were never on main. This audit branch recovers those lines as a separate additive `chat-bank-chaos-addendum` loaded after #95; it does not replace the larger persona/topic bank.

The one-word `temp` graphics-plan commit after #105 was inspected: it touched only `docs/FRONTIER_GRAPHICS_MASTER_PLAN.md` and the immediately following commit replaced that placeholder with the full plan. It did not touch runtime/gameplay code.

## Accounted protected / historical work

### PR #79 — melee timing / axe arc

Branch: `chatgpt/melee-timing-axe-arc`  
Protected historical head: `7ab574d0368a7d61207e1582f420528514f92519`

Status: **MERGED / CURRENT.**

PR #79 was intentionally protected until live review, then merged on 2026-09-09. The recent #91–#105 merge burst did not subsequently modify `src/combat-animation.ts`, so that measured combat-animation slice was not overwritten. Keep the branch as historical evidence; it is no longer an unmerged obligation.

### `fix/core-gameplay-runtime-parity`

Protected historical head: `27499968346b5ad40bf5f64b49c89b480ec83414`

Status: **FORWARD-PORTED / CURRENT.**

Its unique `AreaGameplayShell` and CSS were forward-ported onto current architecture in PR #94 and given a real Ironward Crossing consumer. PR #101 carried the shell into Gatewatch/Ironward Basin, and PR #105 repaired streamed-area M-key ownership while preserving the shell. Do not merge the stale source branch wholesale; its intended work is accounted for on current main.

### `feat/chat-bank-chaos-expansion`

Status: **UNIQUE PARALLEL CONTENT RECOVERED BY THE 2026-09-09 AUDIT BRANCH; DO NOT DELETE UNTIL THAT RECOVERY MERGES.**

The branch contains additional short MMO player lines and physical NPC ambient lines that were not present in merged #95. The recovery is intentionally additive: current #95 owns the large bot/NPC persona-topic expansion; `chat-bank-chaos-addendum` carries only the parallel unique lines after it.

### `mega-overnight-world-boss-backpack`

Status: **PARTIALLY HARVESTED; NEVER MERGE WHOLESALE.**

This branch is hundreds of commits behind modern `main`. Valuable work already recovered into current architecture includes:

- five named giants/world bosses → recovered in PR #59;
- backpack/runtime UI startup → superseded by the current Backpack/UI bootstrap and hardened again by PR #83;
- save/runtime-shape safety intent → superseded by the explicit save compatibility path in PR #82;
- current rare-beast/quality/legend systems evolved substantially in later merged work.

Still unique and therefore **owed / preserved** as of this audit:

- deterministic weapon-affix prototype in `src/item-affixes.ts` (`Keen`, `Hunter’s`, `Ironward`, `Marchwarden’s`, humorous suffixes, bounded damage bonuses);
- authored outer-region content concepts in `src/world-expansion.ts`: **Greymoor, Wolfpine, Blackfen, Giant’s Step, Stonewake** plus their named camps/rest sites/wildlife placements.

Both source files were re-read directly from the preserved branch during this audit. They are not on current main, but they are not lost. Do not revive the old coordinate-expansion implementation: it predates the current addressable/streamed realm architecture. Forward-port the affix design into current loot/equipment systems and migrate the named regions/sites into the realm-address/content pipeline instead.

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
