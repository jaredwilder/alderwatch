# Alderwatch — player request ledger

This is the running player-facing delivery ledger. Update it whenever Jared makes a concrete game request. A request is **SHIPPED** only after implementation, tests/build, merge, deployment, and live verification where available. Do not silently replace a request with a smaller proxy.

## Current ledger

| Status | Request | Delivery evidence / acceptance condition |
|---|---|---|
| SHIPPED | Bow must visibly exist on the HUD and be usable | Hotbar slot 5 + bow combat path live before this ledger. |
| SHIPPED | Wildlife should be encountered much more often | Common wildlife roster substantially expanded with additive persistent IDs; predator caps preserved. |
| FAILED LIVE ACCEPTANCE → HOTFIX | **Use the already-real third-party assets aggressively enough that a refresh looks materially different without corrupting the world.** | PR #30 fixed RTS root scaling, but the next live screenshots exposed a second source: Quaternius MegaKit modules were still assumed to be in Alderwatch world units. Longhouse/fence/roof/floor assemblies can therefore become giant horizontal slabs. Hotfix requirement: normalize every imported medieval GLB, including modular pieces, before any assembly or `Landscape.place` call can use it. |
| HOTFIX NOW | **Remove the giant orange/brown map-spanning slabs and beams visible around South Gate/Alderbrook.** | No modular wall, roof, floor, fence, support or prop may bypass an explicit metre-scale contract. Structural module spans are capped to their intended 2–6 m assembly dimensions; regression tests must reproduce a pathological source slab and prove it cannot remain map-sized. |
| ACTIVE | Make the game substantially more playable, not merely more decorated. | Contract board now has regional combat outings across Southwood, Ironward and Briar Heath with 1–4 defenders and meaningful supply rewards. Continue adding real gameplay only after the live world stops visually breaking. |
| SHIPPED / LIVE FIXED | Ultima Online-style skill-by-use progression on meaningful actions. | Successful use awards visible **+0.1** skill; 100.0 cap. Legacy whole-point counters were removed and affected saves migrate to tenths exactly once. |
| SHIPPED | Show skill increases in the gameplay HUD with a scroll/bar treatment. | Persistent skill summary button plus transient `SKILL INCREASE · +0.1` feed. |
| SHIPPED | Add a character profile with earned titles such as **Grandmaster Bowman**. | Character record lists skills, decimal values, ranks and progress bars; title follows strongest practiced skill; Archery 100.0 = `Grandmaster Bowman`. |
| ACTIVE / PERMANENT | Keep a running ledger of game requests and get stricter about delivery. | This file is a repository-level handoff requirement. Future sessions update it before marking player-facing work complete. |

## Delivery rule

Player-visible claims are judged by the live game, not by code volume. If a screenshot still reads the same after a visual pass, or shows giant/intersecting imported geometry, the visual request remains open even if assets were technically integrated and CI is green.
