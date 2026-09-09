# ALDERWATCH — MASTER MISSION

Status: ACTIVE / CANONICAL SYNTHESIS  
Date: 2026-09-09  
Scope: game-wide direction + living-realm research program + protected integration map

This document is the top-level mission for Alderwatch. It synthesizes the recent gameplay, art, combat, ecology, crafting, NPC/social, world-expansion and frontier-math sessions into one operating plan.

It does **not** replace the more specialized ledgers and proofs. It sits above them and tells future sessions how they fit together.

Primary supporting documents:

- `GAME_REQUEST_LEDGER.md`
- `docs/REALM_EXPANSION_PLAN.md`
- `docs/LIVING_REALM_LEDGER.md`
- `docs/MILLION_ACTOR_REALM_PROOF.md`
- `docs/SOCIAL_SEPARATOR_PROOF.md`
- `docs/CAUSAL_REALM_CONVERGENCE.md`
- `docs/INTEGRATION_INTEGRITY.md`
- `docs/ECOLOGY_2_0_PLAN.md`

---

# 1. THE GAME WE ARE BUILDING

Alderwatch is not a survival-game tech demo and not merely a larger Far March.

The target is an adult, grounded medieval action/survival RPG with:

- satisfying commercial-feeling combat and locomotion;
- deep gather → process → craft → build → cook → trade progression;
- rare loot, named champions, giant bosses and surprising exploration jackpots;
- persistent wildlife ecology that creates stories on its own;
- settlements with interiors, occupations, markets, relationships and consequences;
- simulated players and NPC society that behave like overlapping social worlds;
- many regions, cities, villages, roads, dungeons and nested interiors;
- a huge persistent population and historical world state whose browser cost remains bounded;
- strong visual identity: adult medieval, authored, textured, readable, never voxel/toy/procedural-placeholder looking;
- old-world RPG readability and character/inventory pleasure inspired by UO, with loot/progression excitement closer to Diablo/WoW/ARK;
- one coherent realm in game-state terms even when major areas use loading transitions.

The ambition remains extreme:

> Build a browser medieval world whose logical population, history and addressable world scale are dramatically larger than the subset simultaneously rendered or simulated, without surrendering exact causality where it matters.

The architectural law remains:

> **One enormous persistent realm in game-state terms. One aggressively bounded simulation/rendering bubble in runtime terms.**

---

# 2. CURRENT REALITY — THIS IS ALREADY MORE THAN A PLAN

The realm-scale line has already advanced through a sequence of merged proofs and gameplay implementations.

## 2.1 Realm topology already exists

Current physical chain:

`Far March -> Ironward Crossing -> Ironward Basin -> Crownroad Vale -> King's East Gate -> [next region]`

with a nested branch:

`Ironward Basin -> Deep Iron Mine -> deeper interiors`

Implemented milestones include:

- independently loadable area runtime and area-local persistence;
- Ironward Crossing as a separate browser area;
- Ironward Basin as a deterministic 7×7 addressable cell region;
- only a 3×3 / 9-cell local materialization window;
- Deep Iron Mine with 24 persistent rooms and a hard 7-room materialization budget;
- Crownroad Vale as a 13×13 / 169-cell region approximately 624m across with at most 9 cells resident.

## 2.2 The million-person layer is real and Court-proved under its declared interface

Current population substrate:

- exactly `2^20 = 1,048,576` persistent logical inhabitants;
- 256 shards/wards;
- 4,096 inhabitants per shard;
- stable random-access individual identity;
- no one-record-per-person save requirement;
- exact dormant evolution through an eight-phase histogram quotient;
- sparse named exceptions promoted before unique mutation;
- hard global logical resident bubble cap of 96;
- Crownroad presentation cap currently 18 rendered citizens.

The key theorem is not “we can allocate a million NPC objects.”

It is:

> For the declared dormant public interface, exchangeable citizen microstates with the same phase histogram have identical future public traces, so the population can evolve exactly through the quotient until an individual becomes semantically unique.

This is the foundation we must protect and enrich rather than throw away for a conventional NPC manager.

## 2.3 The social structure is also compressed exactly under declared contracts

Current social substrate includes:

- 262,144 deterministic four-person households;
- 4,096 ordered household phase microstates;
- exact 330 permutation-orbit household certificate types;
- 393,216 deterministic household ties without a giant adjacency-list save;
- three persistent relation types per household: trade, rivalry and oath;
- ward boundary channels: `kin`, `market`, `watch`, `guild`;
- complete social cut state of 256 finite states;
- ordered noncommutative/associative social transducer composition;
- separator-tree repair after a local change in logarithmic depth;
- forward and reverse routing that is Court-checked against literal ordered traversal.

## 2.4 Canonical history and provenance already connect world systems

Merged realm history work now provides:

- one canonical event API for player deeds, simulated-player deeds and consequential NPC/world speech;
- exact source actor identity/provenance on canonical atoms;
- external-key deduplication;
- scheduled structural history including rumor, marriage, birth/lineage, migration, faction succession and grudges;
- a hard cap of 64 actively propagating rumor threads;
- provenance-preserving routing through compressed social state;
- player discovery of Crownroad POIs writing player-sourced history;
- bounded consequence summaries that can feed NPC standing, household memory and physical materialization.

The important direction is now bidirectional:

`gameplay -> history -> propagation -> consequence -> NPC/world gameplay response`

The next mission is not to invent this bridge again. It is to make it dominate the player's lived experience.

---

# 3. THE FLAGSHIP TECHNICAL MOAT — PROTECT THIS

Future sessions must treat the following as a protected research stack.

## 3.1 Ordered World Capsules

Offscreen event histories compile into ordered blocks:

`(F,G) * (F',G') = (F' o F, G + G' o F)`

where order matters.

Use this for offscreen settlement/economic/history catch-up only when the declared boundary behavior remains exact. Never replace ordered consequences with commutative counters merely for convenience.

## 3.2 Realm Cut Lemma / exact hidden-world cuts

Deep Iron's Lower Works is the strongest current proof example:

- 16,384 hidden microstates;
- runtime 576-state sufficient cut certificate;
- exhaustive boundary equivalence against allowed inputs.

General rule:

> A hidden area's interior may be replaced by a compact boundary summary only if every admissible future external interaction produces the same outputs and next summary for all interior states sharing that certificate.

Any distinguishing witness kills the proposed compression.

## 3.3 Population exchangeability quotient

Dormant people may evolve through aggregate phase counts only while identity is irrelevant to the declared public transition/output interface.

The moment gameplay gives a person unique state — conversation, injury, inventory, relationship, crime, quest role, player-caused change — promote that person before mutation.

Authoritative representation:

`bulk quotient + sparse exact exceptions`

Never average a named life back into anonymity merely to recover performance.

## 3.4 Household orbit quotient + sparse structural graph

Use exact household certificate types and deterministic O(1) relation reconstruction to avoid a quadratic social graph.

Do not replace this with arbitrary all-to-all friendship state unless the gameplay value justifies a new sufficient-state design.

## 3.5 Social separators

Geography and society should be designed so only a narrow amount of load-bearing state must cross boundaries.

Natural separators include:

- city gates;
- bridges;
- ferries;
- mountain passes;
- district walls;
- mine lifts;
- roads through forests;
- cave mouths;
- harbor routes.

World design can help the mathematics by creating low-adhesion interaction cuts.

## 3.6 Provenance product labels

Compressed social/history transforms may alter the signal while preserving exact causal source identity as a separate product label.

This is crucial for:

- crime witnesses;
- rumors;
- household grudges;
- faction reputation;
- promises/contracts;
- historical credit/blame;
- “who actually did this?” gameplay.

Never compress away attribution where gameplay later depends on attribution.

## 3.7 Epochal rebase + explicit history doctrine

Current-state simulation may rebase/checkpoint indefinitely.

But promised historical facts are different.

If the product promises to remember `H` unique historical facts, allow archive storage to be `O(H)`. Do not pretend all history can be collapsed into a fixed-size summary without loss.

Compress behavior; retain history deliberately.

## 3.8 Random-access deterministic world identity

World generation and reconstruction must not depend on generation order.

Use stable seed/address keys for areas, cells, entities, slots and epochs so remote content can be reconstructed in O(1) without generating everything before it.

This is the path to huge addressable world space without huge resident object graphs.

---

# 4. MASTER PRODUCT PILLARS

All future work belongs primarily to one of these pillars.

## PILLAR A — LIVING REALM / FRONTIER MATH

Goal: make the million-person/history architecture create visible gameplay continuously.

Priority outcomes:

- migration visibly changes settlement populations;
- faction succession changes services, patrols, quests and political texture;
- crime propagates through witnesses, roads and jurisdictions;
- households remember gifts, rescue, betrayal, shelter, contracts and violence;
- market pressure changes real price/stock/caravan behavior, not only props;
- regional food/iron/security shocks alter local gameplay;
- caravans and travelers exist as persistent identities/flows and materialize when encountered;
- named actors can move between coarse population state and full local actor state without identity loss;
- Crownroad and future cities feel populated because local projection reflects persistent society, not because decorative NPCs are spawned randomly.

## PILLAR B — WORLD / CITIES / DUNGEONS / INTERIORS

Goal: make the realm physically enormous and worth exploring.

Immediate priorities:

- turn Crownroad from proof-region into a full gameplay region;
- open King's East Gate into the next major region;
- recover and migrate preserved old-region concepts into the streamed architecture: **Greymoor, Wolfpine, Blackfen, Giant's Step, Stonewake**;
- detailed enterable building interiors: blacksmith, tavern, trader, homes, guard posts, workshops, storehouses, shrines;
- settlements need functional yards, interiors, occupation staging and meaningful services;
- expand Deep Iron downward and use the reusable dungeon model for crypts, ruins, caves, keeps and smuggler/undercroft systems;
- keep major regions separately loadable and locally bounded rather than creating one giant resident scene.

## PILLAR C — COMBAT / LOCOMOTION / CHARACTER ANIMATION

Goal: commercial action-RPG feel.

Preserve accepted control rules:

- movement during attacks;
- real Rapier/world motion remains authoritative;
- no fake stationary combat;
- accepted mouse inversion on both axes;
- free look and zoom;
- bounded soft targeting rather than teleport magnetism;
- distance-matched combat stride tied to actual travel;
- hip-led kinetic-chain attacks;
- planted/braced lower-body motion where appropriate;
- held primary chaining across the weapon/tool families;
- buffering, defensive cancel windows, perfect defense, ripostes and guard breaks.

Protected open work:

- PR #79 `Rebuild melee timing and axe attack arc` is intentionally unmerged pending live visual acceptance. Do not delete, overwrite or auto-merge it during cleanup.

Next combat mission after acceptance:

- human enemy variety and tactics;
- animal-specific combat behavior;
- hit reactions/stagger readability;
- weapon identity and progression;
- impact/audio/VFX polish;
- authored animation replacement or augmentation only when it clearly beats the current measured procedural/retargeted stack.

## PILLAR D — GATHER / CRAFT / BUILD / FOOD / LOOT

Goal: make wandering, gathering and mastery intrinsically rewarding.

Current foundation already includes:

- dense streamed raw resources across the March;
- deterministic special forage;
- species-specific meats;
- rare carcass cuts;
- rare signature feasts;
- processing chains;
- 47 mastery recipes;
- Recipe Book with discovery, craftability, direct craft and pinning/shopping lists;
- item quality from Common through Legendary;
- reputation-gated quality gear;
- hidden exploration caches;
- giant/world-boss rewards.

Next priorities:

- much deeper building catalogue and meaningful settlement construction;
- advanced stations and interior workshops;
- production chains that change settlement economy;
- weapon/tool affixes recovered from the protected old mega branch and adapted to current equipment architecture;
- regional recipes/materials that create reasons to travel;
- rare resources tied to specific ecologies/dungeons/markets;
- building functionality, not only shape: storage, production, shelter, defenses, NPC use, commerce.

## PILLAR E — ECOLOGY / HUNTING / ANIMAL LIFE

Goal: ecology that creates memorable scenes and useful gameplay.

Preserve:

- regionally distributed wildlife rather than center clustering;
- natural herd/pack behavior;
- predator-prey interactions;
- rare persistent animal traits;
- Wild Karma / Notoriety / Wild Most Wanted;
- carcass scavenging and crows;
- eagles carrying prey;
- animal identity persistence;
- deterministic rare loot.

Next priorities:

- habitat-driven migration/seasonal pressure;
- den/nest/home territories;
- hunger and prey availability influencing predators;
- local extinction/repopulation protections where fun;
- hunting clues/tracks/sign rather than map omniscience;
- ecosystem outputs feeding the realm economy and household pressure systems.

## PILLAR F — NPC / SOCIAL / SIMULATED-PLAYER LIFE

Goal: a world that feels inhabited by agents with memory, status and obligations.

Current foundation includes:

- real persistent townsfolk;
- NPC conversation channel;
- simulated-player WORLD channel;
- persistent simulated-player relationships/grudges;
- autonomous gathering and movement through authoritative commands;
- outsider standing ladder;
- reputation-gated negotiation;
- authoritative NPC contract game;
- canonical history bridges;
- Crownroad citizens drawn from the million-person substrate.

Next priorities:

- real occupations and daily schedules;
- household co-location and family presentation;
- service availability tied to the actual NPC/household state;
- local needs, debts, feuds and favors;
- contract chains that can outlive a single area visit;
- visible migration and succession;
- faction hierarchies;
- crime/witness/justice systems;
- social memory that affects prices, shelter, help, hostility and rumor.

LLM/dialogue may enrich presentation, but authoritative world mutation remains bounded by game systems.

## PILLAR G — ART / UI / READABILITY / IDENTITY

Goal: the game must look and present like a real adult medieval game.

Preserve and continue:

- authored/textured medieval GLB preference;
- no toy/voxel look;
- bounded imported-geometry contracts;
- PBR surfaces and scale-correct material treatment;
- generated/painted item art;
- readable backpack/hotbar/crafting/Recipe Book/profile/map;
- atmospheric loading between major areas;
- proper title/HUD/panel hierarchy;
- UO-like paper-doll/character readability.

Next priorities:

- visual parity across Far March, Ironward, Crownroad and dungeons;
- believable city density and interior detail;
- consistent character silhouettes and clothing quality;
- better combat hit readability;
- regional material palettes without breaking the grounded art direction;
- continued runtime QA of third-party/generated assets before integration.

## PILLAR H — PERFORMANCE / PLATFORM / QA

Goal: world growth must not proportionally increase active-frame cost.

Every major realm pass should track where practical:

- FPS / frame time;
- draw calls;
- triangles;
- active materials/textures/geometries;
- Rapier bodies/colliders;
- animated actors;
- active streaming cells/rooms;
- transition time;
- memory trend across repeated transitions.

Core rules:

- local spatial queries instead of whole-world scans;
- instancing/batching for repeated geometry;
- detailed assets/colliders only near interaction range;
- aggressive unload/disposal contracts;
- deterministic logical state may stay huge while presentation stays small;
- preserve save compatibility;
- never use a giant always-resident navmesh/physics world for the whole kingdom.

---

# 5. FLAGSHIP INTERNAL RESEARCH PROGRAM — THE LIVING REALM COMPILER

This is the part most likely to become historically important. Do not dilute it into “NPC optimization.”

The research goal is:

> Determine how much exact persistent social/economic/historical world behavior can be represented by small sufficient certificates, sparse exceptions and bounded local materialization while still producing a world that feels individually alive when observed.

Each work package should end in executable falsification Courts, not prose alone.

## LR-1 — Representation Morphism Court

Formalize every scale transition:

`FULL ACTOR -> LOCAL AGENT -> HOUSEHOLD/COHORT -> WARD CERTIFICATE -> AREA CAPSULE`

For each morphism record:

- conserved state;
- intentionally lost state;
- reconstruction method;
- valid queries/actions;
- promotion trigger;
- exact vs approximate status.

Then adversarially search for gameplay queries that distinguish states the coarse representation incorrectly merged.

## LR-2 — Household memory as gameplay

Expand the current sparse exact household edge from “contact memory” into a real household relation ledger:

- gift;
- debt;
- rescue;
- shelter;
- trade success/failure;
- contract completion/default;
- assault/theft;
- death caused;
- feud/vendetta;
- oath/alliance.

Keep it sparse: only households with actual consequential contact need explicit actor edges.

## LR-3 — Crime / witness / jurisdiction propagation

Build the cleanest demonstration of provenance-preserving realm causality.

Pipeline:

`crime -> witnesses -> canonical atom -> geographic/social route -> jurisdiction knowledge -> wanted state/patrol/service reaction`

Requirements:

- exact perpetrator identity;
- exact or explicitly bounded witness set;
- rumor propagation separated from legal certainty;
- different districts/factions may know different things;
- evidence can decay/spread while the canonical source fact remains intact;
- guards/NPCs act from what they know, not omniscience.

## LR-4 — Economy that actually uses the four-channel social cut

Turn `market/guild/kin/watch` from mainly presentation pressure into authoritative bounded gameplay.

Examples:

- market pressure -> stock/prices/trader demand;
- guild pressure -> production capacity/repair/workshop availability;
- kin pressure -> labor/farm/household resilience;
- watch pressure -> patrol density/security/tolls/defenses.

Prove bounded update cost and replay equivalence for declared area-level economic events.

## LR-5 — Migration materialization

Household migration already exists in historical accounting. Make it visible.

When a household migrates:

- source settlement loses its population contribution;
- destination gains it;
- materialized residents should eventually reflect the move;
- occupations/services may change;
- relation routes change only through declared structural updates;
- named/promoted members keep exact identities and memories.

## LR-6 — Succession becomes politics

Faction succession should change:

- current leader identity;
- patrol/guard composition;
- contract availability;
- settlement policy;
- service/reputation thresholds;
- allies/enemies;
- visible heraldry/staging where appropriate.

The causal archive should be able to answer **why** the current leader is in power.

## LR-7 — Persistent caravans / travelers as boundary flows

Build caravans as ideal cross-scale actors:

- full agents near the player;
- route/packet state while far away;
- cargo and guard conservation;
- deterministic ETA and route identity;
- ambush/shortage/history consequences;
- exact materialization mid-route when the player intersects their area.

This can connect region economies while demonstrating representation changes clearly to the player.

## LR-8 — Geography-aware separator design

Use the realm graph itself as an optimization variable.

Measure the “adhesion” of candidate region/district cuts by the amount of state that must cross them.

Prefer natural medieval boundaries that minimize cross-boundary coupling without making the world feel artificial.

Potential experiment:

- compare square streaming cells versus road/bridge/gate-aware interaction regions;
- measure certificate width, repair cost and materialization complexity;
- retain square cells for rendering where useful while letting simulation cuts follow a different graph.

## LR-9 — Persistence Content Rank

Classify every persistent realm field as:

- basis state;
- exactly derived state;
- cache;
- presentation only;
- historical archive.

Goal: prevent save growth from duplicating facts that are reconstructible from seed + basis + version.

This is how the world can gain millions of logical entities without becoming millions of serialized blobs.

## LR-10 — Spectral/Kron macro-flow research blade

For large trade/rumor/migration/danger networks, test whether network reduction can preserve useful boundary behavior.

Candidate tools:

- Kron/Schur reduction for declared boundary flow/effective-network behavior;
- spectral sparsification for approximate large-scale diffusion/pressure systems.

These are **not** allowed to replace unique quest causality or named relationship state.

Every approximation must carry a tolerance and a full-model comparison Court.

## LR-11 — Mori–Zwanzig falsification blade

Use coarse-model failure as information.

Run a small settlement at full simulation and coarse simulation from the same state. When futures diverge, search for hidden variables that predict the divergence.

Those variables become candidates for the sufficient state.

Do not patch systematic coarse-model error with arbitrary noise when it is actually missing memory-bearing state.

## LR-12 — Million-Realm Commerciality Court

The math is only a moat if the player can feel it.

Build a test scenario where the player can observe a causal chain such as:

1. help/attack a named citizen or household in Crownroad;
2. leave the region;
3. time advances through compiled history;
4. the household/faction/economy changes remotely;
5. rumor reaches another settlement through a bounded route;
6. NPC standing/service/price/patrol response changes;
7. return later and encounter persistent physical consequences;
8. inspect history/provenance explaining why the world changed.

If the player cannot tell this is deeper than ordinary scripted flags, the research is not yet translated into game value.

---

# 6. WORLD EXPANSION MISSION

## Phase W0 — Make current regions fully playable

Before endless outward expansion, bring gameplay parity to the existing multi-area realm:

### Far March

Keep as the densest mature survival/action foundation:

- Alderbrook;
- Southwood;
- Ironward Heights;
- Briar Heath;
- wildlife/ecology;
- dense gathering;
- bosses/caches/contracts;
- building and economy.

### Ironward Crossing / Basin

Upgrade from proof area to full region gameplay:

- NPC population and services;
- interior blacksmith/mining/trader/guard spaces;
- mining economy;
- contracts and enemies;
- caravan flow;
- Gatewatch social/historical consequences;
- stronger pathfinding/local navigation where density requires it.

### Crownroad Vale

Highest immediate world priority because it is the living-realm showcase:

- Greyhaven as a real city/town, not only resident-materialization proof;
- enterable tavern, smithy, market, homes, guard/watch spaces, abbey interiors;
- enemies, gathering, loot and region-specific contracts;
- population/households used in services and schedules;
- economic/justice/history consequences visibly affecting the city;
- travel and destinations across all 169 addressable cells with only local residency.

### Deep Iron

Expand from proof dungeon to real expedition:

- enemy ecology;
- ore/resource progression;
- hazards;
- boss/major encounter;
- shortcuts;
- deeper Lower Works continuation;
- persistent local consequences;
- optional nested sub-areas.

## Phase W1 — King's East Gate

Open the next major region through the existing world graph.

Do not teleport to an unrelated content island.

Use one of the preserved outer-region concepts as the first migration candidate, selected by strongest gameplay contrast and cleanest geography cut.

Preserved names that must not be lost:

- Greymoor;
- Wolfpine;
- Blackfen;
- Giant's Step;
- Stonewake.

Migrate concepts, not their obsolete old coordinate implementation.

## Phase W2 — Realm factory

Once two or three regions beyond Far March share the same mature runtime, expansion should become a repeatable content process:

- region definition;
- area/cell graph;
- deterministic anchor generation;
- regional asset pack;
- settlements;
- interiors;
- dungeons;
- factions;
- wildlife/resource tables;
- economy;
- population/household shards;
- boundary certificate contract;
- performance budget;
- live acceptance.

The goal is to stop re-solving the engine for every new place.

---

# 7. INTERIORS MISSION

Detailed interiors are a first-class product requirement.

Minimum settlement interior families:

- blacksmith/forge;
- tavern/inn;
- trader/market house;
- ordinary homes;
- wealthy/official homes;
- guard/watch barracks;
- storehouse;
- workshop/carpenter;
- shrine/chapel/abbey spaces;
- mine office/industrial rooms;
- dungeon-support interiors.

Interiors should not be empty shells.

They need:

- occupation props;
- storage;
- NPC use positions;
- service interactions;
- readable entrances/exits;
- believable scale;
- collision/navigation;
- lighting appropriate to the bright readable art direction;
- persistent containers/doors where gameplay needs them;
- loading transitions when required by performance.

---

# 8. PLAYER-FACING FUN DENSITY MISSION

Every new region should provide overlapping reasons to roam:

- ordinary gathering;
- rare gathering;
- wildlife encounters;
- rare animals;
- wanted animals;
- champions;
- giant/world bosses;
- hidden caches;
- dungeons;
- contracts;
- NPC favors/debts;
- household consequences;
- reputation gates;
- region-specific loot/materials;
- cooking/crafting unlocks;
- historical discoveries;
- emergent ecology scenes;
- simulated-player/NPC social events.

A huge world with nothing to do between POIs is failure.

---

# 9. PROTECTED WORK / DO NOT LOSE

The integration ledger remains authoritative, but the following items are important enough to repeat here.

## PR #79 — protected combat work

- branch: `chatgpt/melee-timing-axe-arc`
- status: intentionally unmerged pending live visual acceptance;
- do not force-reset/delete/auto-merge.

## `fix/core-gameplay-runtime-parity`

Unique owed work:

- `src/area-gameplay-shell.ts`
- `src/area-gameplay-shell.css`

Mission:

- make Ironward/Crownroad/Deep Iron retain the expected player shell: Pack / Map / Journal / Recipes / food / 1–5 gear behavior;
- forward-port and wire into current area runtime rather than merging dormant files blindly.

## `mega-overnight-world-boss-backpack`

Never merge wholesale.

Already harvested:

- five named giants;
- backpack/runtime UI direction;
- save/runtime-shape safety intent.

Still unique/owed:

- deterministic weapon-affix design from `src/item-affixes.ts`;
- named outer-region concepts: Greymoor, Wolfpine, Blackfen, Giant's Step, Stonewake and associated sites.

Port the ideas into current architecture only.

---

# 10. CURRENT STATUS SNAPSHOT — RECENT SESSION SYNTHESIS

Recent work can be understood as eight converging lines rather than dozens of isolated PRs.

## Combat line

`#40 -> #41 -> #44 -> #46 -> #52 -> #58 -> #63 -> #68 -> #72 -> #74 -> open #79`

Trajectory:

perfect defense/guard breaks -> buffering/cancels -> bounded soft targeting -> full-body attacks -> tool orientation/skating fixes -> live leg motion -> grounded stride/head commitment -> distance-matched footwork/held chaining -> hip-led kinetic chain -> violent planted axe -> measured contact/arc timing.

## Realm/math line

`#45 -> #47 -> #48 -> #50 -> #54 -> #57 -> #62 -> #70 -> #75`

Trajectory:

record-scale plan -> area runtime/world capsules -> real area transitions -> streamed Ironward -> exact-cut dungeon -> million-person quotient -> household/social separators -> canonical causal history + Crownroad -> consequences + actual resident materialization.

## Social/NPC line

`#39 -> #61 -> #64 -> #66 -> #67 -> #71 -> #75 -> #84`

Trajectory:

adult NPC dialogue/backpack -> simulated players -> persistent society -> WORLD/NPC channels -> outsider standing -> authoritative negotiation/contracts -> causal consequence bridge -> clean forward-port of live villagers.

## Craft/economy line

`#51 -> #56 -> #60 -> #65 -> #69 -> #73 -> #76 -> #77`

Trajectory:

species meat -> rare cuts/feasts -> processing economy -> mastery compendium -> functional recipe command center -> dense resources -> full-March streamed density -> bounded hot paths.

## Ecology line

`#34 -> #36 -> #37 -> #49`

plus the gathering/resource streaming passes above.

Trajectory:

predator-prey spectacle -> Wild Karma/wanted beasts -> rare living wildlife/loot/scavengers -> realm-wide encounter distribution.

## World/navigation line

`#53 -> #59 -> #70 -> #89`

Trajectory:

full March map -> interactive live map + restored giants -> Crownroad region -> live Ironward entry hotfix.

## Art/UI line

`#31 -> #33 -> #34 -> #35 -> #43 -> #85 -> #87 -> #88 -> #89`

Trajectory:

kill world-scale asset corruption -> paper doll/authored settlement fixes -> generated UI art -> working market/UI wiring -> painted icons -> broad visual asset/PBR overhaul -> close-up gable/material cleanup -> corrupted atlas/live travel hotfix.

## Integration/safety line

`#38 -> #55 -> #80 -> #82 -> #83 -> #86 -> #89`

Trajectory:

runtime freeze fixes -> regression alignment -> compile repair -> legacy save compatibility -> critical UI startup ownership -> protected branch ledger -> final live blockers.

This history should be read as convergence toward one game, not a bag of features.

---

# 11. EXECUTION ORDER — WHAT TO DO NEXT

The next work should maximize visible world progress **and** deepen the unique living-realm moat.

## ROUND 1 — Crownroad Commerciality

Make Crownroad the showcase that proves the research matters.

Deliver together:

- live citizen/navigation QA;
- functional Greyhaven services/interiors;
- residents with occupations/schedules;
- household memory affecting at least one service/interaction;
- market/watch pressure affecting authoritative gameplay;
- one consequential regional contract chain;
- one visible historical consequence after leaving and returning;
- performance measurements with resident/materialization caps intact.

Acceptance:

A player should be able to say: “This city remembers what happened elsewhere and reacts for a reason.”

## ROUND 2 — Crime, Witnesses and Justice

Build the provenance showcase.

One crime in one place should be able to:

- be witnessed;
- enter canon with exact source;
- propagate unevenly;
- affect local standing/wanted state;
- change guard/NPC behavior;
- remain unknown elsewhere until information reaches it.

This is both fun and a direct demonstration of the frontier math.

## ROUND 3 — Caravan/Economy Bridge

Create persistent caravan actors crossing Far March/Ironward/Crownroad.

Use them to connect:

- production;
- market demand;
- regional shortages;
- roads/danger;
- player escort/robbery/help;
- history;
- materialization.

## ROUND 4 — Interiors + Occupations

Ship an enterable blacksmith, tavern and occupied homes in a major settlement.

Tie occupants to real population/household identities rather than isolated prop NPCs.

## ROUND 5 — King's East Gate / next region

Open the graph outward using a preserved region concept and the mature realm factory.

Do not expand until the new region has at least one strong gameplay identity, not merely terrain.

## ROUND 6 — Record-Scale Court

Run the research program at hostile synthetic scale:

- 10K / 100K / 1M / 1B logical populations where relevant;
- 10,000-day histories;
- huge address spaces;
- transition soak;
- settlement/region materialization;
- archive growth accounting;
- browser memory/frame budgets;
- citizen promotion/demotion stress;
- thousands of causal atoms and sparse exception growth.

Freeze measurable claims before attempting record language.

---

# 12. RECORD-SCALE CLAIM DISCIPLINE

Alderwatch may aim at history, but no fake record by coordinate trick.

Potential future claims must freeze a measurable definition first, for example:

- number of persistent individually addressable logical inhabitants;
- active-memory-to-logical-population ratio;
- number of addressable persistent world cells/areas;
- number of exact offscreen days/events compiled per unit work;
- number of unique historical facts retained with bounded live propagation;
- concurrent visible animated citizens at a fixed hardware/frame budget;
- area-transition soak without memory leak;
- amount of world state reconstructed random-access without enumeration.

Then compare against public evidence.

---

# 13. DEFINITION OF DONE

Alderwatch succeeds when the following are simultaneously true:

## The moment-to-moment game is good

- movement feels responsive;
- combat feels satisfying;
- gathering/crafting/building have depth;
- hunting and ecology are fun;
- UI is readable and attractive;
- the world looks adult and authored.

## The realm is genuinely huge

- many regions/cities/villages/dungeons exist;
- large spaces load and unload cleanly;
- total content can grow without total runtime cost following it linearly.

## The population feels individually alive when touched

- stable identities exist;
- named people retain consequences;
- households and factions remember;
- migration, succession, reputation and history visibly matter.

## The math remains honest

- exact claims are Court-proved under explicit interfaces;
- approximations carry loss/tolerance contracts;
- unique state is promoted instead of averaged away;
- compressed behavior never silently erases promised history or provenance.

## The browser survives the ambition

- active cells/rooms/actors/colliders remain bounded;
- world growth does not destroy FPS;
- transitions do not leak memory;
- save state remains principled and compatible.

---

# 14. FINAL OPERATING LAW

When a future session faces a choice between:

- adding more isolated content, or making existing systems causally interact;
- spawning more full agents, or changing representation intelligently;
- hiding a scaling problem, or proving a sufficient boundary state;
- adding decorative NPCs, or making persistent society visible;
- inventing another subsystem, or connecting the ones already built;

prefer the option that creates **more player-visible consequence per unit of active runtime cost**.

The million-person/frontier-math program is not a distraction from Alderwatch.

It is the route by which Alderwatch can become the thing the project is actually trying to build:

> **A huge, alive medieval browser world whose local moment feels handcrafted, while an exact or explicitly bounded persistent realm continues to exist far beyond what the player can currently see.**
