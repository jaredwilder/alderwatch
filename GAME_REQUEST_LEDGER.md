# Alderwatch — player request ledger

This is the running player-facing delivery ledger. Update it whenever Jared makes a concrete game request. A request is **SHIPPED** only after implementation, tests/build, merge, deployment, and live verification where available. Do not silently replace a request with a smaller proxy.

## Current ledger

| Status | Request | Delivery evidence / acceptance condition |
|---|---|---|
| SHIPPED | Bow must visibly exist on the HUD and be usable | Hotbar slot 5 + bow combat path live before this ledger. |
| SHIPPED | Wildlife should be encountered much more often | Common wildlife roster substantially expanded with additive persistent IDs; predator caps preserved. |
| FAILED LIVE ACCEPTANCE → ACTIVE | **Use the already-real third-party assets aggressively enough that a refresh looks materially different.** | PR #29 deployed the files but live screenshots showed world-sized RTS geometry, intersecting beams and an effectively unchanged/uglier play read. Code presence does not satisfy this request. Current fix must normalize every imported RTS asset to world metres, hard-cap decorative bounds, reserve simple RTS shells for silhouettes, use MegaKit assemblies for close-up camps/gates, and clear vegetation out of authored sites on existing saves. |
| ACTIVE THIS ROUND | **Stop dragging on errors; stabilize the actual live game instead of stacking more visual accidents.** | No decorative GLB may create a world-sized plane/beam. South Gate, Alderbrook, camps and landmarks must have explicit cleared composition zones. Existing saves must migrate automatically. Regression tests must protect scale/bounds. |
| ACTIVE THIS ROUND | Make the game substantially more playable, not merely more decorated. | Expand the contract board from two tiny fights to regional combat outings across Southwood, Ironward and Briar Heath, with 1–4 defenders and meaningful supply rewards. Existing combat/camera/movement stay intact. |
| SHIPPED / CORRECTING BUG | Ultima Online-style skill-by-use progression on meaningful actions. | Successful use awards visible **+0.1** skill; 100.0 cap. A live screenshot exposed legacy whole-point counters (`Cooking 11.0` after only a few actions). Current round removes the old +1 mutations and migrates affected saves to tenths exactly once. |
| SHIPPED | Show skill increases in the gameplay HUD with a scroll/bar treatment. | Persistent skill summary button plus transient `SKILL INCREASE · +0.1` feed. |
| SHIPPED | Add a character profile with earned titles such as **Grandmaster Bowman**. | Character record lists skills, decimal values, ranks and progress bars; title follows strongest practiced skill; Archery 100.0 = `Grandmaster Bowman`. |
| ACTIVE / PERMANENT | Keep a running ledger of game requests and get stricter about delivery. | This file is a repository-level handoff requirement. Future sessions update it before marking player-facing work complete. |

## Delivery rule

Player-visible claims are judged by the live game, not by code volume. If a screenshot still reads the same after a visual pass, or shows giant/intersecting imported geometry, the visual request remains open even if assets were technically integrated and CI is green.
