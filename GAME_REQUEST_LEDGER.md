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
| SHIPPED / EXPANDED | **Add an extensive and ridiculously funny achievement system.** | Existing achievement system includes witnessed ecology: rabbit airlifts, eagle exhaustion/drop events, wolf-vs-bison hunts, player interference with wolf dinner, predator kills and the food-chain-loop eagle death. Overnight pass adds rare-beast and high-quality-loot achievements. |
| MERGED / AWAITING LIVE ACCEPTANCE | **Add random NPCs so settlements feel inhabited — their bodies must actually render.** | #36 fixes the singular-material invisibility bug, keeps a visible survivor fallback, and upgrades townsfolk to pinned CC0 textured KayKit bodies. Live screenshot remains acceptance. |
| MERGED / AWAITING LIVE ACCEPTANCE | **Replace bare/prototype character and animal presentation with better free-source skins/materials.** | #36 gives townsfolk four textured KayKit CC0 variants and authored animals grounded species palettes while preserving rigs/textures. |
| SHIPPED | **Add a functioning market and trader NPC.** | Mara Pennymarch trades useful goods for persistent crowns; E opens the market and keyboard buy/sell works under pointer lock. |
| MERGED / AWAITING LIVE | **Animals need a karma system too.** | #36 gives every animal persistent Wild Karma, Notoriety, misdeed counters, wanted state and deterministic earned epithets. |
| MERGED / AWAITING LIVE | **Bounties for humans and mean animals.** | Six human contracts remain. #36 adds dynamic **Wild Most Wanted** tracking, named repeat offenders and authoritative posted crown payout. |
| IMPLEMENTED / STACKED OVERNIGHT PASS | **Mega 10× fun pass: keep making Alderwatch feel like UO + WoW + Diablo II + ARK while preserving the living-ecology differentiator.** | New quality tiers make gear drops/crafting materially stronger; captains can drop rare equipment; high crafting skill makes better weapons; rare animals become persistent mini-boss-like individuals; Mara gets reputation-gated quality gear; profile/HUD/inventory expose gear power and rare-beast state. |
| IMPLEMENTED / STACKED OVERNIGHT PASS | **Give me Diablo-style “OH SHIT LOOT” moments without replacing the UO skill loop.** | Existing `Stack.quality` becomes meaningful: Fine → Exceptional → Masterwork → Legendary, with bounded weapon damage bonuses, loot cards, inventory tiers, captain drops and skill-driven crafted quality. |
| IMPLEMENTED / STACKED OVERNIGHT PASS | **Make animal ecology create named legends, not anonymous disposable mobs.** | Deterministic rare traits (Ancient, Dire, Pale, Massive, Scarred, Cunning) persist on individual animals, modify health/scale/reward value, visibly mark rare beasts, strengthen Wild Most Wanted payouts and produce rare-beast sighting/kill achievements. |
| IMPLEMENTED / STACKED OVERNIGHT PASS | **Make reputation actually matter.** | Mara’s locked shelf sells increasingly strong quality equipment behind Free Traders reputation thresholds; positive trader reputation also reduces its crown price. |
| ACTIVE / EXPANDED | **Make the animal ecosystem way funnier, more alive and more consequential.** | Wolves hunt broader prey with bison preference; bears opportunistically join the food web; eagles airlift prey and exhaust; WILD TALE cards expose emergent events; named criminal animals and rare individuals can now become local legends. |
| ACTIVE | Make the game substantially more playable, not merely more decorated. | Contract board has regional combat outings across Southwood, Ironward and Briar Heath. Continue prioritizing immediate fun, systemic interactions, progression and world life over passive decoration. |
| SHIPPED | Show skill increases in the gameplay HUD with a scroll/bar treatment. | Persistent skill summary button plus transient `SKILL INCREASE · +0.1` feed. |
| SHIPPED | Add a character profile with earned titles such as **Grandmaster Bowman**. | Skills, decimal values, ranks and earned title are part of the live character record. |
| ACTIVE / PERMANENT | Keep a running ledger of game requests and get stricter about delivery. | This file is a repository-level handoff requirement. Future sessions update it before marking player-facing work complete. |

## Delivery rule

Player-visible claims are judged by the live game, not by code volume. If a screenshot still reads the same after a visual pass, shows giant/intersecting imported geometry, or a requested fun system exists only in code without a usable player-facing loop, the request remains open even if CI is green.
