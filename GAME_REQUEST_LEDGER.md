# Alderwatch — player request ledger

This is the running player-facing delivery ledger. Update it whenever Jared makes a concrete game request. A request is **SHIPPED** only after implementation, tests/build, merge, deployment, and live verification where available. Do not silently replace a request with a smaller proxy.

## Current ledger

| Status | Request | Delivery evidence / acceptance condition |
|---|---|---|
| SHIPPED | Bow must visibly exist on the HUD and be usable | Hotbar slot 5 + bow combat path live before this ledger. |
| SHIPPED | Wildlife should be encountered much more often | Common wildlife roster substantially expanded with additive persistent IDs; predator caps preserved. |
| SHIPPED / LIVE ACCEPTED | **Use the already-real third-party assets aggressively enough that a refresh looks materially different without corrupting the world.** | User's live screenshot after #34 shows a clean, materially improved Alderbrook with complete authored houses/market/props and no world-corrupting imported geometry. |
| SHIPPED / LIVE ACCEPTED | **Remove the orange/red map-spanning slabs and beams around South Gate/Alderbrook.** | #34 removed the offending close-up substitutions and added fail-closed bounds. User explicitly confirmed “HELL YES GFX FIXED” from the deployed live build. |
| SHIPPED / LIVE FIXED | Ultima Online-style skill-by-use progression on meaningful actions. | Successful use awards visible **+0.1** skill; 100.0 cap. Legacy whole-point counters were removed and affected saves migrate to tenths exactly once. |
| SHIPPED | **P opens a complete Ultima-style character record.** | Live profile shows Karma, Fame, crowns, four reputations, decimal skills/ranks and achievement history. |
| DEPLOYED / AWAITING DIRECT RECHECK | **Show my actual character in the P profile like Ultima Online — facing me, not backwards.** | #34 changed the paper doll to the survivor model's authored forward basis while preserving appearance and equipped weapon/tool. |
| SHIPPED | **Add Karma, Fame and Reputation as separate persistent concepts.** | Killing harmless animals hurts Karma; hostile outlaws improve Karma and settlement reputation; Fame is independent and can coexist with terrible Karma. |
| SHIPPED / EXPANDED | **Add an extensive and ridiculously funny achievement system.** | Existing achievement system now includes witnessed ecology: rabbit airlifts, eagle exhaustion/drop events, wolf-vs-bison hunts, player interference with wolf dinner, predator kills and the food-chain-loop eagle death. |
| FAILED LIVE ACCEPTANCE → FIX IMPLEMENTED / AWAITING PR | **Add random NPCs so settlements feel inhabited — their bodies must actually render.** | Live screenshot shows nameplates but invisible bodies. Root cause: NPC tint code converted every singular Three.js material into a material array, which can make ungrouped skinned meshes render nothing. Current branch preserves material shape, keeps a visible survivor fallback, and upgrades townsfolk to pinned CC0 textured character skins. |
| IMPLEMENTED / AWAITING PR + LIVE | **Replace bare/prototype character and animal presentation with better free-source skins/materials.** | Town NPCs receive four textured KayKit Adventurers CC0 variants from a pinned audited mirror. Authored goat/sheep/deer/bear/bison/wolf/eagle meshes keep their rigs/textures but now receive grounded species palettes instead of default-white test-material presentation. Live screenshot remains the visual acceptance gate. |
| SHIPPED | **Add a functioning market and trader NPC.** | Mara Pennymarch trades useful goods for persistent crowns; E opens the market and keyboard buy/sell works under pointer lock. Her visible body is covered by the NPC live-acceptance row above. |
| IMPLEMENTED / AWAITING PR | **Animals need a karma system too.** | Each animal now owns persistent Wild Karma, Notoriety, misdeed counters, wanted state and deterministic earned epithets. Predation is treated lightly; livestock theft, repeated attacks on people and kills build notoriety much faster. |
| IMPLEMENTED / AWAITING PR | **Bounties for humans and mean animals.** | Existing six human contracts remain. A dynamic **Wild Most Wanted** contract tracks the worst living repeat offender, follows its moving world position, gives it a named rap sheet, and resolves when the tracked beast is killed by the player. |
| ACTIVE / EXPANDED | **Make the animal ecosystem way funnier, more alive and more consequential.** | Wolves hunt broader prey with bison preference; bears opportunistically join the food web; eagles airlift prey and exhaust; WILD TALE cards expose emergent events. Current branch adds persistent identities so the same offender can become locally infamous rather than every incident being anonymous. |
| ACTIVE | Make the game substantially more playable, not merely more decorated. | Contract board has regional combat outings across Southwood, Ironward and Briar Heath. Continue prioritizing immediate fun, systemic interactions, progression and world life over passive decoration. |
| SHIPPED | Show skill increases in the gameplay HUD with a scroll/bar treatment. | Persistent skill summary button plus transient `SKILL INCREASE · +0.1` feed. |
| SHIPPED | Add a character profile with earned titles such as **Grandmaster Bowman**. | Skills, decimal values, ranks and earned title are part of the live character record. |
| ACTIVE / PERMANENT | Keep a running ledger of game requests and get stricter about delivery. | This file is a repository-level handoff requirement. Future sessions update it before marking player-facing work complete. |

## Delivery rule

Player-visible claims are judged by the live game, not by code volume. If a screenshot still reads the same after a visual pass, shows giant/intersecting imported geometry, or a requested fun system exists only in code without a usable player-facing loop, the request remains open even if CI is green.
