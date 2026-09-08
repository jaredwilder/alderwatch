# Alderwatch — player request ledger

This is the running player-facing delivery ledger. Update it whenever Jared makes a concrete game request. A request is **SHIPPED** only after implementation, tests/build, merge, deployment, and live verification where available. Do not silently replace a request with a smaller proxy.

## Current ledger

| Status | Request | Delivery evidence / acceptance condition |
|---|---|---|
| SHIPPED | Bow must visibly exist on the HUD and be usable | Hotbar slot 5 + bow combat path live before this ledger. |
| SHIPPED | Wildlife should be encountered much more often | Common wildlife roster substantially expanded with additive persistent IDs; predator caps preserved. |
| FAILED LIVE ACCEPTANCE → HOTFIX | **Use the already-real third-party assets aggressively enough that a refresh looks materially different without corrupting the world.** | Real assets are visibly present now, but live screenshots after #32 still show huge red/orange geometry crossing Alderbrook. This remains failed acceptance until the close-up settlement is clean. |
| HOTFIX NOW | **Remove the remaining orange/red map-spanning slabs and beams around South Gate/Alderbrook.** | Close-up Alderbrook no longer uses the simplified large RTS skyline pieces. The final mesh gate now rejects world-dominating, long-plate, thin-deck and tall malformed geometry; regression includes both a 70 m flat slab and a 58×7×2.5 m tall beam. Live screenshot remains final acceptance. |
| SHIPPED / LIVE FIXED | Ultima Online-style skill-by-use progression on meaningful actions. | Successful use awards visible **+0.1** skill; 100.0 cap. Legacy whole-point counters were removed and affected saves migrate to tenths exactly once. |
| SHIPPED | **P opens a complete Ultima-style character record.** | Live profile shows Karma, Fame, crowns, four reputations, decimal skills/ranks and achievement history. |
| HOTFIX NOW | **Show my actual character in the P profile like Ultima Online.** | P profile receives a full-body paper-doll render from the same loaded survivor model, current appearance and current equipped weapon/tool. |
| SHIPPED | **Add Karma, Fame and Reputation as separate persistent concepts.** | Killing harmless animals hurts Karma; hostile outlaws improve Karma and settlement reputation; Fame is independent and can coexist with terrible Karma. |
| SHIPPED | **Add an extensive and ridiculously funny achievement system.** | 30 persistent achievements live, including `DRANK YOUR FIRST CROW MILK!`, bunny crimes, predator milestones, crafting/building/trading, notoriety, fame and Grandmaster progression. |
| SHIPPED | **Add random NPCs so settlements feel inhabited.** | Nine named wandering townsfolk with roles and ambient interaction are live. |
| SHIPPED | **Add a functioning market and trader NPC.** | Mara Pennymarch trades useful goods for persistent crowns; E opens the market and keyboard buy/sell works under pointer lock. |
| ACTIVE | Make the game substantially more playable, not merely more decorated. | Contract board has regional combat outings across Southwood, Ironward and Briar Heath. Continue prioritizing immediate fun, systemic interactions, progression and world life over passive decoration. |
| SHIPPED | Show skill increases in the gameplay HUD with a scroll/bar treatment. | Persistent skill summary button plus transient `SKILL INCREASE · +0.1` feed. |
| SHIPPED | Add a character profile with earned titles such as **Grandmaster Bowman**. | Skills, decimal values, ranks and earned title are part of the live character record. |
| ACTIVE / PERMANENT | Keep a running ledger of game requests and get stricter about delivery. | This file is a repository-level handoff requirement. Future sessions update it before marking player-facing work complete. |

## Delivery rule

Player-visible claims are judged by the live game, not by code volume. If a screenshot still reads the same after a visual pass, shows giant/intersecting imported geometry, or a requested fun system exists only in code without a usable player-facing loop, the request remains open even if CI is green.
