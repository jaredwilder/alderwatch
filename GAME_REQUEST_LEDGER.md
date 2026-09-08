# Alderwatch — player request ledger

This is the running player-facing delivery ledger. Update it whenever Jared makes a concrete game request. A request is **SHIPPED** only after implementation, tests/build, merge, deployment, and live verification where available. Do not silently replace a request with a smaller proxy.

## Current ledger

| Status | Request | Delivery evidence / acceptance condition |
|---|---|---|
| SHIPPED | Bow must visibly exist on the HUD and be usable | Hotbar slot 5 + bow combat path live before this ledger. |
| SHIPPED | Wildlife should be encountered much more often | Common wildlife roster substantially expanded with additive persistent IDs; predator caps preserved. |
| FAILED LIVE ACCEPTANCE → ACTIVE | **Use the already-real third-party assets aggressively enough that a refresh looks materially different without corrupting the world.** | RTS roots and MegaKit modules now have metre-scale contracts, but live review still shows several long orange/brown bands. Current round adds a last-line geometry sanity gate that removes only pathological long/thin imported mesh children while preserving normal buildings and props. |
| ACTIVE THIS ROUND | **Remove the remaining orange/brown map-spanning slabs and beams visible around South Gate/Alderbrook.** | Post-normalization prop instances are scanned for extreme long/thin child geometry. Regression test reproduces a 70 m slab and proves it is rejected while a normal 12×7×8 m house survives. Live screenshot remains the final acceptance gate. |
| SHIPPED / LIVE FIXED | Ultima Online-style skill-by-use progression on meaningful actions. | Successful use awards visible **+0.1** skill; 100.0 cap. Legacy whole-point counters were removed and affected saves migrate to tenths exactly once. |
| ACTIVE THIS ROUND | **P opens a complete Ultima-style character record.** | Profile must show current skill/title plus Karma, Fame, crowns, four reputations, every decimal skill, ranks, and achievement history. P toggles the sheet directly during play. |
| ACTIVE THIS ROUND | **Add Karma, Fame and Reputation as separate persistent concepts.** | Killing harmless animals hurts Karma; killing hostile outlaws improves Karma and Alderbrook/March Warden reputation; Fame can rise whether the player is heroic or notorious. Profile explains the distinction. |
| ACTIVE THIS ROUND | **Add an extensive and ridiculously funny achievement system.** | 25+ persistent achievements, including `DRANK YOUR FIRST CROW MILK!`, bunny crimes, predator milestones, crafting/building/trading, notoriety, fame and Grandmaster progression. Unlocks appear as large live award cards. |
| ACTIVE THIS ROUND | **Add random NPCs so settlements feel inhabited.** | At least eight named, visibly wandering townsfolk with roles and ambient lines; NPC visuals reuse the authored survivor rig and animation clips. E talks to nearby NPCs. |
| ACTIVE THIS ROUND | **Add a functioning market and trader NPC.** | Mara Pennymarch trades useful survival/building goods for persistent crowns. Bounties/outlaws seed the economy; E beside Mara opens the market; keyboard buying/selling works even while pointer lock is active. |
| ACTIVE | Make the game substantially more playable, not merely more decorated. | Contract board has regional combat outings across Southwood, Ironward and Briar Heath. Continue prioritizing immediate fun, systemic interactions, progression and world life over passive decoration. |
| SHIPPED | Show skill increases in the gameplay HUD with a scroll/bar treatment. | Persistent skill summary button plus transient `SKILL INCREASE · +0.1` feed. |
| SHIPPED | Add a character profile with earned titles such as **Grandmaster Bowman**. | Existing K record lists skills, decimal values, ranks and progress bars. Current P record expands that into the full notoriety/reputation/achievement sheet. |
| ACTIVE / PERMANENT | Keep a running ledger of game requests and get stricter about delivery. | This file is a repository-level handoff requirement. Future sessions update it before marking player-facing work complete. |

## Delivery rule

Player-visible claims are judged by the live game, not by code volume. If a screenshot still reads the same after a visual pass, shows giant/intersecting imported geometry, or a requested fun system exists only in code without a usable player-facing loop, the request remains open even if CI is green.
