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

## Acceptance standard

The goal is not merely to claim that a huge realm exists in data.

Alderwatch should visibly feel larger and more alive while preserving responsive combat, adult medieval art direction, readable daylight, existing saves, camera behavior, movement quality and real browser performance.

The long-term historical ambition is intentionally extreme: build a browser-based medieval world whose persistent logical scale is far larger than what is simultaneously simulated or rendered, and make that invisible virtualization feel like one coherent living realm.
