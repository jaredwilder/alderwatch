# Alderwatch — player request ledger

This is the running player-facing delivery ledger. Update it whenever Jared makes a concrete game request. A request is **SHIPPED** only after implementation, tests/build, merge, deployment, and live verification where available. Do not silently replace a request with a smaller proxy.

## Current ledger

| Status | Request | Delivery evidence / acceptance condition |
|---|---|---|
| SHIPPED | Bow must visibly exist on the HUD and be usable | Hotbar slot 5 + bow combat path live before this ledger. |
| SHIPPED | Wildlife should be encountered much more often | Common wildlife roster substantially expanded with additive persistent IDs; predator caps preserved. |
| FAILED LIVE ACCEPTANCE → SOURCE FIX THIS ROUND | **Use the already-real third-party assets aggressively enough that a refresh looks materially different without corrupting the world.** | Real assets are visibly present, but the #33 live screenshot still shows map-spanning red roof/beams. This round stops the exact nested MegaKit substitutions that create those close-up assemblies, restores the known-stable original kit for village roof/gable/details/palisade/shelter names, and keeps bounded complete third-party huts/market/storage around them. Live screenshot remains the final gate. |
| BLOCKER / MUST PASS LIVE | **Remove the remaining orange/red map-spanning slabs and beams around South Gate/Alderbrook.** | Generic heuristics were insufficient. The current fix is source-specific plus fail-closed root bounds: risky nested close-up substitutions are forbidden, standalone `village_details` dressing is removed, and complete authored roots are hard-capped against their declared metre-scale contracts. |
| SHIPPED / LIVE FIXED | Ultima Online-style skill-by-use progression on meaningful actions. | Successful use awards visible **+0.1** skill; 100.0 cap. Legacy whole-point counters were removed and affected saves migrate to tenths exactly once. |
| SHIPPED | **P opens a complete Ultima-style character record.** | Live profile shows Karma, Fame, crowns, four reputations, decimal skills/ranks and achievement history. |
| FIX THIS ROUND | **Show my actual character in the P profile like Ultima Online — facing me, not backwards.** | Paper doll now keeps the survivor model's authored forward basis instead of rotating it 180°. Current appearance and equipped weapon/tool remain shown. |
| SHIPPED | **Add Karma, Fame and Reputation as separate persistent concepts.** | Killing harmless animals hurts Karma; hostile outlaws improve Karma and settlement reputation; Fame is independent and can coexist with terrible Karma. |
| EXPANDED THIS ROUND | **Add an extensive and ridiculously funny achievement system.** | Existing 30-achievement system expands with witnessed ecology: rabbit airlifts, eagle exhaustion/drop events, wolf-vs-bison hunts, player interference with wolf dinner, predator kills and the food-chain-loop eagle death. |
| SHIPPED | **Add random NPCs so settlements feel inhabited.** | Nine named wandering townsfolk with roles and ambient interaction are live. |
| SHIPPED | **Add a functioning market and trader NPC.** | Mara Pennymarch trades useful goods for persistent crowns; E opens the market and keyboard buy/sell works under pointer lock. |
| ACTIVE / EXPANDED THIS ROUND | **Make the animal ecosystem way funnier, more alive and more consequential.** | Wolves now hunt hare/goat/sheep/deer/bison/eagle; bears may attack wolves and bison; eagles have shorter visible flight/ground energy cycles; carried prey gets a hanging/swinging presentation; nearby emergent events produce a WILD TALE feed and persistent wildlife chronicle in P. |
| ACTIVE | Make the game substantially more playable, not merely more decorated. | Contract board has regional combat outings across Southwood, Ironward and Briar Heath. Continue prioritizing immediate fun, systemic interactions, progression and world life over passive decoration. |
| SHIPPED | Show skill increases in the gameplay HUD with a scroll/bar treatment. | Persistent skill summary button plus transient `SKILL INCREASE · +0.1` feed. |
| SHIPPED | Add a character profile with earned titles such as **Grandmaster Bowman**. | Skills, decimal values, ranks and earned title are part of the live character record. |
| ACTIVE / PERMANENT | Keep a running ledger of game requests and get stricter about delivery. | This file is a repository-level handoff requirement. Future sessions update it before marking player-facing work complete. |

## Delivery rule

Player-visible claims are judged by the live game, not by code volume. If a screenshot still reads the same after a visual pass, shows giant/intersecting imported geometry, or a requested fun system exists only in code without a usable player-facing loop, the request remains open even if CI is green.
