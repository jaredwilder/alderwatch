# Alderwatch — Realm Expansion Plan

Status: ACTIVE / LIVING PLAN
Started: 2026-09-08
Owner intent: make Alderwatch as large, alive and historically ambitious as a browser-based 3D survival/action RPG can reasonably become, without destroying frame rate or turning the project into a tech-demo rewrite.

This file is deliberately ongoing. Future research, experiments, falsifications, implementation receipts and revised decisions should be appended or incorporated here instead of replacing the ambition with a smaller proxy.

## North-star thesis

Alderwatch should not become merely a larger Far March. It should become a persistent medieval realm in which Alderbrook is only the first village the player happened to reach.

The architectural law is:

> One enormous persistent realm in game-state terms; one aggressively bounded simulation/rendering bubble in runtime terms.

The game may contain many regions, cities, villages, dungeons, roads, factions, caravans, schedules, wildlife populations and persistent actors while only a small relevant subset is actively represented by Three.js, Rapier, skeletal animation, nav/crowd simulation and expensive AI at any moment.

## Existing foundation we should generalize

Current Alderwatch already contains the embryo of the desired architecture:

- finite Far March realm today, with Southwood, Ironward Heights and Briar Heath;
- persistent authoritative state for players, resources, structures, stations, containers, enemies, forage, animals and progression;
- stable entity IDs and presentation submitting commands to a local authority rather than directly owning inventory/world authority;
- distant frontier resources rendered through instancing;
- detailed authored resources and Rapier colliders only materialized near the player;
- ground cover maintained in local chunks around the player;
- authored medieval GLB kit, wildlife, survivor, textures and existing optimization tooling.

Do not throw this away. Turn it into a first-class realm-streaming architecture.

## Realm hierarchy

Target abstraction:

```text
Realm
  -> Region
      -> Area
          -> Streaming Cell
              -> Active simulation bubble
```

A region is a large lore/geography unit. An area is independently loadable and owns its local visual scene, physics world/colliders, nav data, ambient simulation presentation and area-specific asset bundle. Streaming cells further bound work inside an area.

Example destination realm:

```text
THE ALDERWATCH REALM

The Far March
  Alderbrook / Southwood
  Briar Heath
  Southroad wilderness

Ironward
  Ironward Basin
  Ironward City
  quarry district
  Deep Iron Mine

The Crownroad
  agricultural vale
  market city
  monasteries and estates
  ruined royal fortress

Western Briars
  wetlands
  marsh settlement
  drowned ruins
  crypt complex

Salt Coast
  fishing country
  port city
  cliffs
  smugglers
  sea caves

Northern Reach
  upland forest
  mountain settlement
  fortress
  ancient subterranean complex
```

This is illustrative, not a cap.

## Loading screens are an asset, not a defeat

For a browser game, region/major-area transitions can use short atmospheric loading treatments at gates, roads, passes, boats, mine lifts or dungeon entrances.

On transition:

1. persist outgoing authoritative area state;
2. remove/dispose outgoing Three.js area objects;
3. dispose or detach outgoing area physics/nav state;
4. unload area-specific heavy assets when appropriate;
5. retain realm-level persistent simulation state;
6. load destination area module/assets;
7. reconstruct destination local physics/nav/render state;
8. materialize only currently relevant persistent entities;
9. place player at the destination portal/entry;
10. verify no renderer/physics/resource leak across repeated transitions.

This lets total shipped world size grow far beyond active GPU/CPU cost.

## Simulation LOD

Rendering LOD alone is insufficient. Alderwatch needs simulation LOD.

### Tier 0 — hero bubble

Approximate target: 0–40 m, tuned by area.

Full fidelity:

- combat and hit logic;
- Rapier collision;
- skeletal animation;
- high-frequency navigation/steering;
- NPC reactions and perception;
- doors/interactables;
- wildlife behavior;
- physical drops;
- gathering;
- local audio and effects.

### Tier 1 — local visible world

Approximate target: 40–120 m, tuned by line of sight and density.

Reduced fidelity:

- lower-frequency AI/navigation updates;
- reduced animation update cadence where visually safe;
- simplified perception;
- pooled/batched/instanced environment;
- fewer interaction colliders;
- expensive combat reasoning only when engagement is plausible.

### Tier 2 — far visible area

Representation rather than full agent simulation:

- distant citizens/guards/herds as cheap proxies where useful;
- chimney smoke, watchfires, windmills, caravans and skyline landmarks;
- low-cost motion and event indicators;
- no unnecessary full physics or pathfinding.

### Tier 3 — unloaded realm

No Three.js, Rapier, navmesh or skeletal animation.

Persistent actors advance through event/schedule state, for example:

```text
caravan-ironward-17
  departed: Alderbrook 08:00
  destination: Ironward City
  ETA: 10:35
  route: crownroad-east
  cargo: iron
  guards: 4
  risk: 0.23
```

If the player enters the relevant area mid-journey, the actor is materialized at the state/location implied by the abstract simulation.

## Living-city doctrine

Do not try to run hundreds of full NPC brains continuously.

A persistent citizen may have:

- stable ID;
- name;
- home;
- profession;
- workplace;
- faction/reputation links;
- relationships;
- inventory/wealth band;
- daily/weekly schedule;
- current high-level activity;
- memory flags relevant to the player/world.

Far from the player, a citizen is data plus events. Near the player, that citizen becomes a rendered/pathfinding/interactive actor.

This permits settlements with convincing claimed populations much larger than the number of expensive active NPCs.

Layer city life with systems such as:

- work/home/tavern schedules;
- guard shifts;
- market days;
- caravans;
- merchants opening/closing;
- livestock pasture movement;
- hunters leaving/returning;
- shortages and local prices;
- raids and aftermath;
- deaths/funerals/replacements where appropriate;
- faction disputes;
- wanted criminals;
- festivals/religious gatherings;
- rumors generated from actual realm events.

The objective is not crowd decoration. The city should behave like a machine whose visible scene is a local projection of persistent world state.

## Navigation direction

Current wildlife steering can remain appropriate for lightweight creatures and wilderness behavior, but towns, dungeons and larger human populations should investigate a Recast/Detour-style navmesh + crowd layer suitable for WebAssembly/browser execution.

Navigation generation/query work should be eligible for Web Workers where beneficial. Runtime route following must remain bounded by simulation LOD.

## Dungeon doctrine

Dungeons are ideal independently loadable areas and can be extremely ambitious because occlusion and constrained corridors naturally cap visibility.

Target dungeon families include:

- mines;
- crypts;
- abandoned keeps;
- caves;
- bandit tunnels;
- underground temples;
- sewers;
- haunted abbeys;
- burial mounds;
- smuggler caves;
- fortress undercrofts.

Persistent dungeon state should include stable instance identity, doors, traps, containers, enemies, bosses, shortcuts, discoveries and clear/reset state.

First proving dungeon target: **Deep Iron Mine**.

It should be a real expedition, not a tiny cave:

mine entrance -> working galleries -> abandoned shaft -> hostile occupation -> collapsed lower mine -> old subterranean structure -> boss -> shortcut/alternate exit.

Once this framework works, subsequent dungeons should mostly be content production rather than new engine work.

## Asset-streaming doctrine

The current monolithic load-all-shared-assets approach is acceptable for the present slice but must not scale unchanged to a kingdom.

Target asset organization:

```text
CoreAssets
  player character
  common combat equipment
  shared UI/world items

FarMarchPack
  Far March foliage
  Alderbrook architecture

IronwardPack
  stone/industrial city kit
  mining assets

CoastPack
  coast vegetation
  docks/ships

DungeonMinePack
DungeonCryptPack
...
```

Investigate:

- Vite dynamic-import code splitting;
- area manifests;
- browser cache/service-worker strategy;
- Meshopt/Draco where appropriate;
- KTX2/Basis GPU texture compression for suitable content;
- aggressive asset reuse and instancing;
- explicit disposal contracts;
- load budgets per area.

Total install/cache size may grow substantially over time while title-screen and first-area startup cost remain bounded.

## Physics doctrine

Do not keep a kingdom-sized general triangle collider resident.

Investigate tiled terrain and area-local terrain physics, including heightfields where topology permits. Only relevant local interaction geometry should own active colliders.

A crate, tree, fence or building on the far side of the realm does not need active Rapier state.

## WebGPU posture

Do not make a WebGPU rewrite a prerequisite for realm expansion.

The current WebGL2 architecture can support a much larger world if streaming, batching, simulation LOD and asset lifetime are handled correctly.

WebGPU should be benchmarked later on a focused branch. Migration should occur only if measured gains justify the shader/material migration cost.

## Initial content-scale target

First major realm milestone should aim roughly for:

- 6 major overworld regions;
- 3 substantial cities;
- 6–10 villages/hamlets;
- 20–30 wilderness POIs;
- 12–18 dungeons/interiors;
- hundreds of persistent named/logical NPCs;
- thousands of logical wildlife/resource/world entities.

At runtime, only a bounded subset should be expensive: tens of animated people/animals/enemies and a controlled local collider/nav/render workload.

These numbers are milestones, not ceilings.

## Performance constitution

Adding world content may increase total game size and total persistent-state complexity. It must not proportionally increase frame cost in the active area.

Every serious realm benchmark should track at least:

- FPS;
- frame time;
- draw calls;
- triangles;
- GPU textures/geometries where available;
- active Rapier colliders/bodies;
- active NPCs;
- active wildlife/enemies;
- active streaming cells;
- area transition time;
- memory trend across repeated area transitions.

A city or dungeon that looks impressive but violates the active performance envelope is not accepted.

## Planned implementation sequence

### Realm Expansion 1 — break the world-size ceiling

Build the substrate first but prove it with visible content immediately:

- `RealmManager`;
- `AreaDefinition`;
- `AreaRuntime`;
- area transitions/loading treatment;
- area-aware player location;
- additive/backwards-compatible persistence;
- lazy area asset manifests;
- unload/dispose contract;
- performance instrumentation;
- convert current Far March into `far-march` without visible regression;
- add a small second proving area and verify round-trip persistence and no leaks.

### Realm Expansion 2 — Ironward Basin

Build the first genuinely new major region:

- mountainous approaches;
- mining roads;
- farms;
- quarry;
- caravans;
- fortified city;
- blacksmith/industrial quarter;
- mine district;
- outer hostile pressure;
- Deep Iron Mine entrance.

### Realm Expansion 3 — living population

- persistent NPC registry;
- professions;
- schedules;
- virtualized citizens;
- navmesh/crowd layer;
- merchants;
- guards;
- travelers;
- caravans;
- local events and consequences.

### Realm Expansion 4 — dungeon runtime

- reusable dungeon area framework;
- Deep Iron Mine as full proving expedition;
- persistent doors/loot/boss/shortcut state;
- room/sector streaming and occlusion-friendly rendering.

### Realm Expansion 5+ — realm factory

Use the proven substrate to accelerate production of new regions, settlements, dungeons and factions rather than repeatedly rewriting the engine.

## Research queue

The next research pass must deliberately look for mechanisms that could raise the ceiling further, including ideas from:

- large browser/WebAssembly worlds;
- MMO simulation virtualization;
- hierarchical spatial partitioning;
- entity-component and data-oriented designs;
- interest management;
- event-sourced/world-state simulation;
- procedural city/road/dungeon generation;
- constraint solving;
- graph algorithms;
- compression/succinct data structures;
- geometry streaming/clustered rendering;
- GPU-driven rendering;
- occlusion and portal systems;
- browser storage/cache limits and strategies;
- Web Workers/SharedArrayBuffer where deployment constraints allow;
- deterministic simulation and reproducible procedural generation;
- mathematical results from the user's broader research estate that could provide unusual leverage.

## Research pass 2 — 2026-09-08 — raise the ceiling again

The second research pass changes the plan materially. Ordinary streaming is not the end-state. The much larger opportunity is **representation-changing simulation**: the same persistent realm entity/population may exist as a full agent, a mesoscopic packet, a macroscopic flow, or a compact event/capsule representation depending on what the player can currently observe and affect.

Published crowd-simulation work already demonstrates micro/macro aggregation and disaggregation, and newer hybrid work allows the boundary between microscopic and mesoscopic regimes to move dynamically with local conditions. Alderwatch should generalize that idea far beyond pedestrian motion.

### The fidelity ladder becomes a typed simulation morphism

Target representation ladder:

```text
FULL ACTOR
  skeletal animation + physics + local AI + inventory + pathfinding
      ↓ aggregate
LOCAL PROXY / CROWD AGENT
  position + velocity + schedule + small behavior state
      ↓ aggregate
MESOSCOPIC PACKET
  population cohorts + flows + queue/route state + sparse named exceptions
      ↓ aggregate
MACRO AREA STATE
  stocks + faction regime + demographic/economic flows + event obligations
      ↓ compile
WORLD CAPSULE / EVENT BLOCK
  state transition + state-conditioned deltas + sparse exceptions
```

The reverse path is disaggregation/materialization.

Every conversion must carry an explicit conservation/loss contract. At minimum, the following may never silently disappear when they are gameplay-load-bearing:

- named identity and unique-life status;
- alive/dead state;
- ownership and container/item obligations;
- population counts by persistent class;
- cargo/resource/currency conservation where applicable;
- faction control/reputation consequences;
- scheduled arrivals/departures;
- player-caused scars, crimes, loot, structure changes and quest flags;
- deterministic random key/counter position;
- boundary flows into neighboring areas;
- explicit list of details intentionally discarded because they are presentation-only.

This is the core route to a realm whose logical population can be orders of magnitude larger than its active agent count.

### Random-access deterministic world generation

Adopt the counter-based-RNG idea rather than letting generation order define the world.

Target conceptual API:

```text
worldRandom(
  realmSeed,
  areaId,
  cellId,
  entitySlot,
  propertyTag,
  epoch
) -> deterministic random bits
```

Counter-based generators such as Philox/Threefry are designed as keyed functions of counters rather than sequential mutable RNG streams. The world consequence is enormous: any cell, NPC slot, loot roll family or procedural feature can be reconstructed independently, in any order, on any worker, without generating all preceding cells first.

This enables a **seed + authored anchors + sparse deviations** storage model. Static base-world content should not be serialized merely because it exists. Persist only what cannot be regenerated exactly or what has changed from the deterministic base.

### Spatial indexing as an execution primitive

Assign world cells stable Morton/Z-order or Hilbert-order keys in addition to ordinary `(x,z)` coordinates.

Potential benefits:

- nearby cells tend to live near one another in storage/cache order;
- prefetch can request a contiguous neighborhood interval;
- OPFS/IndexedDB records can be laid out by spatial locality;
- worker load can be partitioned into weighted contiguous intervals;
- future authoritative servers can shard the same ordered realm space;
- deterministic streaming/replay becomes easier to audit.

Do not assume Hilbert always beats Morton. Benchmark index cost versus locality. The architectural point is to make locality a first-class key rather than repeatedly scanning giant object maps.

### Hierarchical navigation, never kingdom-scale navmesh search

Use three distinct navigation levels:

```text
REALM GRAPH
  cities / regions / ports / passes / dungeon portals

REGIONAL ROUTE GRAPH
  road junctions / gates / bridges / district portals

LOCAL NAVIGATION
  Recast/Detour navmesh + local crowd/steering
```

HPA*-style abstraction is directly relevant: local crossing paths are cached while global pathfinding traverses clusters instead of every cell. Recast/Detour remains the local geometric truth, not the kingdom-wide search substrate.

A merchant travelling from Alderbrook to Ironward should not run A* across every navmesh polygon between them. Far away, the merchant traverses the realm/road graph. Only the current local leg becomes a Recast path.

### Main thread becomes a presentation thread

Long-term target:

- main thread: input, renderer submission, audio/UI, minimal orchestration;
- simulation worker: macro realm/event progression;
- nav worker: tile generation/rebuilds and expensive route work;
- optional asset/decompression worker where useful;
- future worker pool: cell jobs partitioned by deterministic spatial key.

Transferable `ArrayBuffer`s provide zero-copy ownership transfer. If Alderwatch's hosting/dependency policy can safely support cross-origin isolation, `SharedArrayBuffer`/Atomics and shared WebAssembly memory can provide a lower-overhead snapshot ring between workers. This is an optimization lane, not a prerequisite: it requires COOP/COEP deployment headers and must retain a transferable-buffer fallback.

### Browser persistence must leave localStorage behind

The current localStorage save is a good vertical-slice implementation, not a historical-scale realm store. Web Storage is capped around 10 MiB across local/session storage. IndexedDB, CacheStorage and OPFS live under the browser's broader origin quota system; OPFS is specifically optimized for performant in-place file access and exposes synchronous file operations inside workers.

Target persistence split:

```text
IndexedDB
  small indexed metadata
  entity lookup tables
  save manifest
  journals/indexes

OPFS
  compact binary area snapshots
  world-capsule blocks
  larger sparse-delta files
  optional generated caches

CacheStorage / normal HTTP cache
  immutable versioned asset packs
```

Request persistent storage when appropriate, detect quota with `navigator.storage.estimate()`, handle quota failure explicitly, and preserve export/import/backups so a browser clearing site data does not become an invisible permanent-loss trap.

### Geometry and asset delivery become cell-native

The glTF `EXT_mesh_gpu_instancing` specification explicitly recommends grouping instances into colocated cells for large game worlds so cells can be culled by bounds. `KHR_meshopt_compression` can compress geometry, animation and instance-transform buffers with fast WebAssembly/SIMD decoding. KTX2/Basis can keep textures compressed through transmission and GPU-native transcoding, and KTX2 supports mip-level streaming.

Therefore asset authoring should increasingly produce **streaming-ready cell packs**, not giant monolithic scenes that runtime code must take apart.

### WebGPU is now a serious optional ceiling-raiser

Do not block realm work on WebGPU, but raise the status from “maybe someday” to **dedicated benchmark branch after Realm Expansion 1**.

Current Three.js already demonstrates:

- WebGPU compute;
- indirect draw parameter buffers;
- storage buffers;
- instanced skinning;
- individually posed skinned instances whose computed poses can be reused by render passes.

That opens a future “crowd presentation plane” where hundreds or more visible low/medium-fidelity citizens share geometry and GPU animation, while the handful of combat/conversation-critical actors retain full ordinary rigs.

The acceptance rule remains empirical: if the WebGPU branch is not materially better on Alderwatch workloads, do not migrate just because it is newer.

## Estate sweep — frontier mathematics with direct realm leverage

This pass searched the durable mathematical-estate control plane plus relevant Library artifacts for structures that are not merely metaphorically similar but can become exact engineering machinery.

### Transfer A — HUMUHUMUNUKUNUKUĀPUAʻA becomes the offscreen-world compiler

The estate's HUMUHUMUNUKUNUKUĀPUAʻA finisher contains a remarkable directly transferable stack. Its declared closed ingredients include:

- `IK2-05` Semidirect Order-Aware Block Summary Theorem;
- `IK2-06` Fully Abstract Compositional Block Certificate;
- `IK2-07` Epochal Sparse Rebase Theorem;
- `CS-01` Canonical Additive Transducer Monoid;
- `CS-02` Minimal Fully Abstract Compositional Quotient;
- `CS-04` Log-Depth Ordered Parallel Composition;
- `CS-05` Infinite-History Finite-Behavior Collapse for the Three-Resource Machine;
- `CS-06` Quotient-Before-Encoding Principle;
- `WORLD-02` Fault-Localized Parallel Composition Tree.

The core block representation is precisely the sort of object an offscreen area needs:

```text
S_u = (F_u, G_u)

F_u : starting semantic state -> ending semantic state
G_u : starting semantic state -> additive delta vector
```

with ordered composition conceptually:

```text
(F,G) * (F',G')
  = (F'∘F,
     q -> G(q) + G'(F(q)))
```

Order matters. A bandit raid then a relief caravan need not equal a relief caravan then a bandit raid.

**Alderwatch application:** define a finite offscreen semantic machine for each area archetype and compile chunks of ordered offscreen history into these summaries. The additive vector can carry quantities such as population changes, stock changes, treasury/cargo flow, casualties, reputation effects and spawned obligations, while the transition function carries non-additive regime state such as faction control, market condition, siege state or settlement alert state.

Histories that are behaviorally indistinguishable for all admissible future interactions may collapse to the same canonical class instead of remaining separate histories. Long sequences of blocks can be composed with a balanced tree rather than replayed tick-by-tick.

This could turn “the player has been away from Ironward for 19 in-game days” from nineteen days of simulated ticks into a small ordered composition problem.

### Transfer B — sparse exceptions are the bridge between population fields and named people

HUMU's structured-sparse machinery suggests a second layer: most of a city's offscreen population can live in aggregate cohorts while **exceptions** remain explicitly represented.

Sparse exception examples:

- NPCs the player has met;
- named quest actors;
- criminals/wanted animals;
- unique traders;
- recently wounded/dead/displaced citizens;
- people carrying unique items;
- actors currently crossing an area boundary;
- player-caused state deviations.

This creates a principled hybrid:

```text
AREA MACROSTATE
+ CANONICAL BEHAVIOR CLASS
+ AGGREGATE POPULATION/RESOURCE CHANNELS
+ SPARSE NAMED EXCEPTIONS
```

The number of canonical citizens need not equal the number of active full objects.

### Transfer C — epochal rebase gives the realm an indefinite lifetime

The estate's `IK2-07` result is explicitly about an indefinitely long verified process retaining fixed-size sparse certificates when each epoch ends inside the declared structured-sparse family and a checkpoint decodes/re-encodes state.

World translation:

- simulate/compose an in-game day or week;
- commit an area checkpoint;
- retain the new exact current-state capsule;
- start the next epoch from that checkpoint;
- keep only selected narrative/history events separately.

This is a route to save-state size depending principally on **current structured state + deliberate history**, not on every simulation tick since the realm was created.

Do not misread this as free historical compression. The same theorem stack contains `STREAM-02` “No Free Retrospective Succinctness.” If the game promises that the player can inspect every past event, those events must remain represented somewhere. Current-state compression and historical archival are separate products.

### Transfer D — MSL REPRESENTATION_AFFORDANCE becomes simulation architecture

The MSL estate produced the law:

```text
SEMANTIC_EQUIVALENCE != PROOF_AFFORDANCE_EQUIVALENCE
CONTENT_GAIN = ZERO does not imply AFFORDANCE_GAIN = ZERO
```

and the explicit notions `REPRESENTATION_AFFORDANCE`, `MOVE_FRONTIER`, `SEMANTIC_MORPHISM`, `LOSS_LEDGER` and typed projection/relaxation/refinement relations.

Port this directly to the engine:

```text
SIMULATION_MORPHISM
  FROM <full-agent | proxy | packet | field | capsule>
  TO   <...>
  KIND <equivalence | projection | refinement | approximation>
  CONSERVED <list>
  LOST <list>
  RECONSTRUCTION <exact | seeded | distributional | impossible>
  VALID_FOR <observations/actions>
```

A crowd packet and 83 full citizens may encode the same load-bearing world facts but expose radically different operations. The full-agent view affords collision, dialogue and melee. The packet view affords fast flow integration and mass route updates. Neither is universally “better.” The representation is selected by the operations the current observation frontier requires.

That is a far stronger doctrine than distance-only LOD.

### Transfer E — CONTENT_RANK / CONSTRAINT_BASIS becomes a persistence minimizer

The MSL estate also insists:

```text
CONSTRAINT_COUNT != CONTENT_RANK
MULTIPLE_VIEWS_OF_ONE_SOURCE != MULTIPLE_INDEPENDENT_SOURCES
```

Apply this to save state.

Alderwatch should eventually distinguish:

- **basis state** — irreducible facts that must be persisted;
- **derived state** — exactly recomputable from basis + seed + version;
- **cache state** — expensive but disposable reconstruction accelerators;
- **presentation state** — never authoritative;
- **history state** — retained because the product deliberately promises memory, not because simulation requires it.

A `PersistenceContentLedger` can make migrations and save growth auditable. If a field is derivable from other persisted fields, it does not automatically earn permanent storage merely because runtime code finds it convenient.

This is how a million logical objects avoid becoming a million JSON blobs.

### Transfer F — a new Alderwatch Realm Cut Lemma

The VVC–MSL/JSPACE closure theorem contains a certified-cut principle: once an interior subproof is certified, active context can retain a sufficient frontier rather than the entire hidden proof interior. The analogous world theorem is elementary enough to state directly.

> **Realm Cut Lemma — engineering form.** Let `A` be an inactive area, and let `sigma(A)` be a boundary summary. Suppose that for any two internal states `A1,A2` with `sigma(A1)=sigma(A2)`, every admissible ordered sequence of external boundary inputs produces identical boundary outputs and identical next summaries until an observation/refinement enters the area. Then, for all observers outside `A`, replacing the full internal state by `sigma(A)` is behaviorally exact during that interval.

Proof sketch: induct on the ordered boundary-input sequence. Equal sufficient summaries imply equal first outputs and equal next summaries; repeat. The hidden interior is therefore observationally irrelevant until the contract's refinement boundary is crossed.

**Engineering consequence:** total active simulation cost can scale with the width/complexity of the current **interaction frontier**, rather than total realm volume, whenever inactive regions admit bounded sufficient summaries.

This is a candidate constitutional theorem for Alderwatch. The implementation test is adversarial: generate pairs of different microstates with equal proposed summaries and search for any external sequence that distinguishes them. Any witness proves the summary is missing a load-bearing variable.

### Transfer G — graph separators should shape the geography itself

The estate's graph-decomposition playbooks repeatedly ask: “What state must cross a bag boundary?” This is exactly the realm-streaming question.

Make geography help the mathematics.

Natural medieval-world separators include:

- mountain passes;
- bridges;
- ferries;
- walled gates;
- canyon mouths;
- forest roads;
- cave mouths;
- mine lifts;
- district gates;
- river crossings;
- harbor routes.

When an area has only a small number of interaction portals, its boundary state is small even if its interior is enormous. This means level/world design can deliberately create **low-adhesion simulation cuts** while still looking natural and historically plausible.

The technical direction is hierarchical graph decomposition: choose area/cell boundaries that minimize expensive cross-boundary state, not merely square-grid distance.

### Transfer H — classical spectral/Kron tools become optional macro-world reducers

The estate also contains graph-sparsification and network-reduction families. Two are worth a focused prototype once trade/rumor/danger networks exist:

- **Kron/Schur reduction:** eliminate interior nodes of a network while preserving specified boundary behavior such as effective resistance/flow relationships under the model assumptions;
- **spectral sparsification:** replace a dense graph by a much smaller weighted graph while approximately preserving all Laplacian quadratic forms within a declared tolerance.

These are not for combat or unique quest causality. They are candidates for very-large-scale diffusion systems such as trade pressure, rumor propagation, migration pressure, regional danger or traffic equilibrium.

### Transfer I — Mori–Zwanzig is a warning system for bad coarse-graining

The estate's coarse-graining bank contains Mori–Zwanzig projection: eliminating unresolved variables generally leaves memory and orthogonal forcing in the exact reduced dynamics.

Game translation: if an aggregate town model repeatedly fails to reproduce the future of a full simulation, do not merely add random correction factors. Treat the discrepancy as evidence that the chosen macrostate is missing memory-bearing variables.

A practical validation protocol can run a small city in full simulation, project it into the proposed macrostate, evolve both, and measure which hidden variables predict the divergence. Those variables are candidates to join the `CONSTRAINT_BASIS` of the coarse model.

This is a research blade, not a requirement to implement a generalized Langevin equation in the game.

## Realm-scale stress targets — architecture ceiling, not immediate content promise

Do not confuse launch content targets with architecture stress targets. The engine should be attacked with synthetic scale far beyond the hand-authored realm so we learn where the true ceiling is.

Create escalating rehearsals such as:

```text
REALMSCALE-10K
  10,000 persistent logical actors
  random area entry/exit
  30 in-game days offscreen

REALMSCALE-100K
  100,000 persistent logical actors
  thousands of caravans/schedules
  arbitrary area materialization

REALMSCALE-1M
  1,000,000 logical identities/cohort members
  sparse named deviations
  no million-object JS heap requirement

WORLDSPACE-100M
  100,000,000 deterministic addressable static feature slots/candidates
  generated random-access from seed/counter
  only touched deviations persisted

TRANSITION-SOAK
  1,000 repeated area transitions
  no monotonic renderer/physics/asset memory leak

CITY-CROWD
  progressively 100 / 250 / 500 / 1,000 visible citizen proxies
  measure WebGL baseline and optional WebGPU instanced-skinning branch
```

Passing such tests would not mean Alderwatch has one million meaningful hand-authored characters. It would prove the architecture can carry a realm far larger than its immediate content production rate.

## Record-scale claim discipline

The ambition is explicitly record-setting, but do not advertise “largest browser game ever” merely because a large coordinate range or procedural seed exists.

Any future record-style claim must freeze a measurable definition first, for example:

- persistent logical actors with independently addressable state;
- persistent explorable area count;
- unique authored/procedural POI count;
- deterministic addressable world feature count;
- concurrent visible animated agents at a target frame budget;
- total cacheable realm content with bounded startup footprint;
- active-memory-to-logical-world ratio;
- offscreen catch-up throughput.

Then compare against public evidence. Historical ambition is encouraged; fake Guinness-by-coordinate-system is not.

## Revised implementation sequence after research pass 2

The original sequence remains, with new substrate added rather than a rewrite detour.

### Realm Expansion 1A — break area lifetime and persistence coupling

- `RealmManager`, `AreaDefinition`, `AreaRuntime`;
- Far March as first area;
- tiny second proving area;
- area transition and disposal;
- area-aware persistence;
- renderer/physics/memory instrumentation;
- preserve old saves through migration.

### Realm Expansion 1B — deterministic cell identity + persistence plane

- stable area/cell IDs;
- random-access keyed generation API;
- seed + deviation model for new content;
- IndexedDB/OPFS prototype behind save abstraction;
- binary/snapshot format experiment;
- cell-local asset manifests;
- transition soak test.

### Realm Expansion 1C — world capsule experiment

Before betting the entire game on the frontier math, create one small exact experiment:

- finite offscreen settlement state machine;
- ordered event blocks represented as `(F,G)`;
- canonical summary composition;
- full tick-by-tick oracle implementation;
- randomized/adversarial equivalence tests comparing block composition versus replay;
- epoch checkpoint/rebase;
- sparse named exceptions;
- persistence-size and catch-up-speed measurement.

Kill or narrow the approach if its assumptions force a toy simulation. Expand it aggressively if it preserves genuinely fun city consequences.

### Realm Expansion 2 — Ironward Basin + Deep Iron Mine

Use the architecture immediately on visible new content. Do not spend months making a perfect abstract substrate before the player gets a new city/region/dungeon.

### Realm Expansion 3 — multiscale living population

- Recast local nav;
- realm/regional route hierarchy;
- citizens that aggregate/disaggregate across fidelity levels;
- schedules, markets, guards, caravans;
- fidelity-morphism loss ledger;
- full-sim-vs-coarse validation harness.

### Realm Expansion 4 — crowd rendering ceiling branch

Benchmark WebGPU/TSL instanced skinning and compute-driven crowd presentation against the existing WebGL renderer. This branch earns promotion only with measured Alderwatch wins.

### Realm Expansion 5+ — realm factory

Once the compiler/runtime survives synthetic scale and Ironward proves it in real gameplay, expansion becomes parallel content production: more regions, cities, dungeons, factions, events and regional economies using the same substrate.

## Research sources retained for this plan

Current external references worth preserving:

- Three.js `BatchedMesh` docs — multi-draw batching and per-object frustum culling: https://threejs.org/docs/pages/BatchedMesh.html
- Three.js `WebGPURenderer` manual — WebGPU + WebGL2 fallback, TSL, current experimental status: https://threejs.org/manual/en/webgpurenderer
- Three.js WebGPU skinning/instancing examples: https://threejs.org/examples/?q=skinn
- Three.js `IndirectStorageBufferAttribute` — indirect draw parameters under WebGPU: https://threejs.org/docs/pages/IndirectStorageBufferAttribute.html
- recast-navigation-js — Recast/Detour WebAssembly, Three.js integration, crowd simulation, worker navmesh examples: https://github.com/isaac-mason/recast-navigation-js
- HPA*, Botea/Müller/Schaeffer, *Near Optimal Hierarchical Path-Finding* (2004).
- Xiong et al., *Hybrid modelling of crowd simulation* (2010), DOI 10.1016/j.procs.2010.04.008.
- *HyPedSim: A Multi-Level Crowd-Simulation Framework* (2024).
- *Coupling microscopic and mesoscopic models for crowd dynamics with emotional contagion* (Frontiers in Physics, 2025).
- Salmon et al., *Parallel Random Numbers: As Easy as 1, 2, 3* (SC11) — counter-based Philox/Threefry.
- MDN OPFS: https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
- MDN storage quotas: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- MDN Web Workers and transferable objects: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
- MDN SharedArrayBuffer / cross-origin isolation: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer
- Khronos `EXT_mesh_gpu_instancing` — includes large-world cell-grouping guidance.
- Khronos `KHR_meshopt_compression` — geometry/animation/instance-transform compression.
- Khronos KTX2 / `KHR_texture_basisu` — GPU texture compression and mip streaming.
- Kron reduction / Schur complement literature for boundary-preserving network reduction.
- Spielman–Srivastava spectral sparsification literature.
- Mori–Zwanzig coarse-graining literature.
- Hilbert/Morton space-filling-curve partitioning/load-balancing literature.

Estate sources retained:

- `jaredwilder/msl-ore-estate/MEMORY.md`
- `jaredwilder/msl-ore-estate/compression/VVC-MSL-KBK-CLOSURE-THEOREM.md`
- Library `MSL_v1_5_EG411_LANGUAGE_AUTOPSY_2026-08-31.md`
- Library `MSL_v1_5_EG411_EXTENDED_LANGUAGE_AUTOPSY_2026-08-31.md`
- Library `HUMUHUMUNUKUNUKUAPUAA-FINISHER-REPORT.md`
- Library math-technique / lifetime theorem banks for graph decomposition, spectral sparsification and Mori–Zwanzig projection.

## Acceptance standard

The goal is not merely to claim that a huge realm exists in data.

Alderwatch should visibly feel larger and more alive while preserving responsive combat, adult medieval art direction, readable daylight, existing saves, camera behavior, movement quality and real browser performance.

The long-term historical ambition is intentionally extreme: build a browser-based medieval world whose persistent logical scale is far larger than what is simultaneously simulated or rendered, make that invisible virtualization feel like one coherent living realm, and use exact/validated representation boundaries wherever possible so scale does not require surrendering causality.
