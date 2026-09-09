# Alderwatch — Settlement Generation Frontier Plan

Status: ACTIVE / MANDATORY WORLD-BUILDING EXTENSION  
Date: 2026-09-09  
Scope: cities, villages, hamlets, camps, forts, farms, monasteries, roadside sites, ruins, dungeon approaches, interiors and all future generated built environments

This document is a mandatory extension of `docs/REALM_EXPANSION_PLAN.md` and `docs/ALDERWATCH_MASTER_MISSION.md`.

The current renderer/frontier-graphics program is advancing faster than the built-world composition system. That mismatch is now a product risk. Better grass, bark, sky, horizon LOD and materials cannot rescue settlements that are fundamentally composed as random objects on flat ground.

## Non-negotiable doctrine

> **NO RANDOM-SCATTER SETTLEMENTS.**

Alderwatch may use deterministic randomness *inside* a semantic spatial plan. It may not use random coordinates as the spatial plan.

The existing streamed-region site builders are scaffolding, not the target generator. Current patterns such as fixed literal site coordinates, cell-local clutter counts, jittered grids and ad-hoc hand placement are permitted only as transitional content while the Settlement Compiler below is built.

A believable settlement must exist first as a functional, topological and morphological object. Geometry is a projection of that object.

The governing pipeline becomes:

`PURPOSE -> TERRAIN -> MOVEMENT -> DISTRICTS/ZONES -> PARCELS -> BUILDINGS -> YARDS -> PROP STORIES -> VISTAS -> RENDER LOD`

not:

`RNG -> building -> barrel -> fence -> tree -> hope`

---

# 1. RESEARCH SYNTHESIS

## 1.1 Terrain-aware village growth beats scatter

Emilien, Bernhardt, Peytavie, Cani and Galin, *Procedural Generation of Villages on Arbitrary Terrains* (The Visual Computer, 2012) remains unusually relevant to Alderwatch because it targets small European villages rather than modern grids. Its key ideas are still strong:

- use interest maps to determine where settlement growth is attractive;
- let roads attract buildings and buildings induce road extension;
- segment land into parcels after settlement seeds emerge;
- use shape grammars that adapt buildings to slope.

Alderwatch should generalize the interest-map idea into a **Settlement Suitability Field** combining slope, road access, water, sunlight/aspect, defensibility, flood/wetness, wind exposure, existing ecology, resource access and social/economic purpose.

Source: https://doi.org/10.1007/s00371-012-0699-7

## 1.2 Streets and parcels must be co-generated

Chen, Song and Ortner, *Hierarchical Co-generation of Parcels and Streets in Urban Modeling* (Computer Graphics Forum / Eurographics 2024), identifies a failure directly analogous to ours: generating streets and parcels independently tends to produce irregular parcels or poor streets. Their framework hierarchically splits parcels, adds streets to guarantee access, and globally optimizes geometric quality.

Alderwatch should steal the structural lesson:

> **Every occupied parcel must be reachable from the circulation graph, and the circulation graph must evolve with the parcels rather than being painted underneath them afterward.**

For towns, this becomes a coupled street/plot compiler. For camps and forts it becomes a coupled path/activity-zone compiler.

Source: https://doi.org/10.1111/cgf.15053

## 1.3 Roads need fields and costs, not straight ribbons

Chen, Esch, Wonka, Müller and Zhang, *Interactive Procedural Street Modeling* (SIGGRAPH 2008), showed that tensor fields can guide large street networks while retaining global/local controls. Modern production workflows such as SideFX Project Pegasus likewise use shortest-path costs and artist-controllable line systems for roads, tracks and rivers.

Alderwatch should use **terrain-aware cost fields** and route classes:

- king road: low curvature, broad clearance, bridges/fords preferred over brutal slope;
- village lane: follows parcel fronts and terrain contours more freely;
- cart track: trades directness for slope and mud avoidance;
- footpath: cheapest traversal with narrow clearance;
- defensive access: deliberately constrained by gates/chokepoints;
- game trail: ecology/animal-driven rather than civic.

Candidate roads should be solved over a weighted field, then simplified/smoothed under curvature and slope constraints. Roads should deform settlement morphology; settlement morphology should in turn create new local paths.

Sources:
- https://doi.org/10.1145/1360612.1360702
- https://www.sidefx.com/pegasus/

## 1.4 Buildings should be grammar outputs inside real plots

Wonka et al. (SIGGRAPH 2003) and Müller et al. (SIGGRAPH 2006) established split/shape grammars and CGA-style procedural architecture. CityEngine continues this production doctrine in 2026: streets, blocks, lots, building envelopes and façades remain distinct controllable procedural layers rather than one random generator.

Alderwatch should not procedurally invent arbitrary mesh soup at runtime. It should use **authored modular building assets controlled by a compact building grammar**:

`plot -> frontage + access + yard -> massing -> roof family -> openings -> service attachments -> clutter sockets`

Rules depend on settlement morphology, occupation, wealth, faction, climate and local materials. A smithy and a fisherman house should differ because their *functional grammar* differs, not because one RNG roll selected another prefab.

Sources:
- https://doi.org/10.1145/882262.882324
- https://doi.org/10.1145/1179352.1141931
- https://www.esri.com/arcgis-blog/products/city-engine/3d-gis/whats-new-in-arcgis-cityengine-2026-0

## 1.5 Semantic dependency graphs are the right abstraction for props and interiors

Recent 3D scene-synthesis research increasingly separates **what objects mean and how they depend on one another** from the final coordinate solve. FuncScene (2024) organizes interiors into functional groups before object placement. SDGScenes (2026) represents object dependencies explicitly and then solves positions under semantic and physical constraints.

Alderwatch does **not** need the VLM/generative-neural part of those systems. We should steal the representation and solver structure:

`semantic dependency graph -> deterministic constraints -> geometric optimization`

Examples:

- chopping block must be near wood pile;
- wood pile should be near workshop/storage but out of the main path;
- market stall must face market circulation;
- bed must be in a sheltered interior zone;
- stable must connect to road/yard and allow animal clearance;
- cookfire must have a social working radius and avoid flammable wall placement;
- defensive tower must dominate an approach or wall segment;
- wagon must be reachable by a cart-width path and should not spawn sideways inside a doorway.

Sources:
- FuncScene: https://doi.org/10.1016/j.cagd.2024.102319
- SDGScenes: Pattern Recognition, 2026, “User-intent driven indoor scene generation via semantic dependency graph”

## 1.6 WFC is a local grammar, not the city planner

Wave Function Collapse is valuable, but the literature keeps showing its main weakness: local adjacency does not automatically satisfy global solvability or high-level structure. Facey & Cooper (AIIDE 2024) explicitly note that WFC commonly needs global constraints; hierarchical WFC improves scale but does not eliminate the need for global design structure.

Therefore Alderwatch may use WFC for:

- façade/module variation;
- roof/detail tiling;
- interior micro-layout after room function is fixed;
- ruin wall/floor composition;
- dungeon room microstructure.

It should **not** use unconstrained WFC as the macro settlement generator.

Sources:
- https://doi.org/10.1609/aiide.v20i1.31863
- https://doi.org/10.1609/aiide.v19i1.27498

## 1.7 Quality-Diversity is the antidote to one procedural look

A single optimizer tends to converge on one “best” town and then every seed becomes a cousin of it. Quality-Diversity methods such as MAP-Elites instead search for many high-performing solutions across a feature space. A 2025 QD survey specifically notes video-game PCG as an active application area.

Alderwatch should use an **offline/build-time constrained Quality-Diversity pass** to discover settlement variants, not run an evolutionary algorithm every frame.

Useful morphology axes:

- compact <-> dispersed;
- linear road village <-> clustered market village;
- open <-> fortified;
- agrarian <-> industrial;
- regular/planted <-> organic/grown;
- flatland <-> contour-following;
- poor <-> wealthy;
- sparse frontier <-> dense urban frontage.

Hard feasibility constraints stay absolute. QD searches only among valid settlements.

Source: https://doi.org/10.1016/j.swevo.2025.102240

## 1.8 Visibility must become a design variable

Space-syntax and isovist work treats visibility/permeability as measurable properties of urban space. That is directly useful to a game because “looks composed” is partly about what is revealed from movement paths.

Alderwatch should compute cheap **viewshed/isovist scores** at important approach points:

- gate reveals market tower / keep / church / mountain landmark;
- main street terminates or bends toward a strong visual anchor;
- campfire is readable on approach but not exposed absurdly far through forest;
- stockade entrance reveals an interior focal point rather than a random fence backside;
- market square has several readable exits and landmark orientation;
- alleys produce controlled compression/reveal rather than accidental dead visual noise.

Recent visibility research continues to combine visibility graphs with pedestrian-scale perception; the underlying geometry is cheap enough for offline settlement evaluation.

Reference: https://www.frontiersin.org/journals/built-environment/articles/10.3389/fbuil.2026.1896222/full

## 1.9 Procedural tools should preserve authored control

Production evidence from Ghost Recon Wildlands and SideFX Project Pegasus reinforces a crucial point: procedural world building works best when tools automate repeated construction while artists/designers retain high-level and local control. Ubisoft used procedural technology to free artists for polish rather than to remove authored judgement.

For a one-person project this is even more important. We need a generator that creates strong candidates and accepts anchors/overrides, not a black box that creates 10,000 mediocre villages.

Sources:
- https://www.sidefx.com/community/80-level-ghost-recon-wildlands/
- https://www.sidefx.com/pegasus/

---

# 2. MEDIEVAL MORPHOLOGY IS PART OF THE GENERATOR

“Medieval” cannot mean modern suburb geometry with timber textures.

Research on surviving medieval town morphology repeatedly emphasizes the relationship between streets, narrow/deep burgage plots, frontages, rear access, market places and later subdivision/encroachment. Scottish and English evidence shows street lines and plot boundaries materially shaped building placement and commercial frontage.

Alderwatch town grammars should therefore support at least:

- narrow/deep street-facing plots around important commercial streets;
- irregular plot depth caused by walls, waterways, terrain and pre-existing fields;
- houses/workshops biased toward plot frontage;
- working yards, storage, sheds and livestock behind frontage buildings;
- secondary lanes/back lanes where plot access demands them;
- dense frontage near markets and important junctions;
- wider/sparser plots toward edges;
- market space as a widening/square/triangle generated from traffic and economic role;
- progressive subdivision and encroachment as settlement history/wealth changes;
- planted towns that read more regular than organically grown villages.

References:
- Stell & Tait, *Framework and form: burgage plots, street lines and domestic architecture in early urban Scotland*, Urban History 43(1).
- Historic England, *Newark-on-Trent Historic Area Assessment* (2024), documenting survival of a medieval street plan and coherent historic character.
- Society of Antiquaries of Scotland work on burgage-plot morphology.

---

# 3. THE SETTLEMENT COMPILER

The built-world factory should become an explicit deterministic compiler.

## Stage A — Charter

Every site starts with a compact semantic charter, e.g.:

```ts
{
  id: 'greyhaven',
  kind: 'market-town',
  populationBand: 3,
  functions: ['market','guard','craft','residential','religious','storage'],
  economy: ['grain','livestock','timber','iron-transit'],
  defense: 0.55,
  wealth: 0.48,
  age: 0.72,
  plannedness: 0.42,
  anchors: ['king-road-west','king-road-east','river-crossing'],
  landmarks: ['market-hall','watch-tower','shrine']
}
```

The charter is authored intent. The compiler turns it into space.

## Stage B — Terrain and constraint fields

Build low-resolution world-space fields for:

- slope and local relief;
- drainage/wetness/flood risk;
- water access;
- sunlight/aspect where useful;
- forest/vegetation removal cost;
- road/travel cost;
- defensibility/exposure;
- buildability;
- proximity to resource/economic anchors;
- protected gameplay spaces;
- skyline/landmark opportunity.

## Stage C — Movement skeleton

Connect required anchors using weighted least-cost paths and hierarchy-aware road logic.

Then add only loops/branches that improve:

- access;
- parcel service;
- circulation redundancy;
- market connectivity;
- gameplay exploration;
- settlement morphology.

No random spaghetti.

## Stage D — Functional district / activity graph

Before buildings exist, solve a graph of functional dependencies.

Examples:

`gate -> guard -> market -> inn -> stable`

`smithy -> fuel store -> water -> cart access`

`farm -> field -> barn -> animal yard -> lane`

`charcoal camp -> kiln -> timber stacks -> sleeping shelter -> cookfire -> water path`

`bandit stockade -> gate kill-zone -> lookout -> barracks -> loot store -> captive area`

This graph is the semantic truth used later by NPC schedules and economy systems.

## Stage E — Coupled parcels and paths

Generate parcels/activity zones and circulation together.

Hard rules:

- every occupied parcel has valid access;
- important civic/commercial parcels face suitable streets/spaces;
- rear/service access exists where needed;
- slopes stay within building archetype limits;
- parcels do not overlap water, walls, roads or protected spaces;
- parcel geometry carries stable IDs independent of render cell.

## Stage F — Building grammar

Choose a functional building archetype and fit it to the parcel.

The grammar chooses among authored modules while respecting:

- frontage;
- door access;
- terrain/slope;
- yard requirement;
- roof/material family;
- occupation;
- settlement wealth;
- neighboring massing;
- fire/industrial separation;
- wall/gate constraints;
- visibility goals.

A building is not “hut_c at random yaw.”

## Stage G — Yard and micro-circulation compiler

Generate actual human-use space around buildings:

- desire paths from doors to road/well/work areas;
- fences aligned to parcel boundaries;
- gates at path intersections;
- drainage/ditch edges;
- cart turning/parking pockets;
- chopping/working clearances;
- animal pens;
- gardens/crops;
- refuse/manure zones kept away from presentation-critical civic space unless historically intentional.

## Stage H — Prop stories

Every clutter cluster receives a reason.

Examples:

- **woodworking story:** chopping block + chips + stacked logs + axe socket + cart access;
- **market story:** stall + awning + crates + weighing surface + foot circulation;
- **stable story:** trough + hay + hitching + manure + wagon turning clearance;
- **guard story:** weapon rack + brazier + bench + sightline to gate;
- **charcoal story:** kiln + stacked cut timber + sacks + water + blackened ground;
- **fishing story:** racks + nets + barrels + boat access + drying area.

Random variation chooses among valid story realizations. It never scatters individual props independently.

## Stage I — Composition optimization

Score generated candidates from representative player viewpoints.

At minimum:

- landmark visibility / approach reveal;
- silhouette overlap;
- street-wall continuity;
- focal-point readability;
- entrance legibility;
- dead-space penalty;
- accidental object tangency/overlap penalty;
- excessive repetition penalty;
- excessive symmetry penalty except in explicitly planned/fortified sites;
- walk-route visual rhythm;
- gameplay readability.

This can be deterministic local search and/or an offline QD search over valid candidates.

## Stage J — Runtime compilation

The selected spatial plan compiles into the existing bounded runtime:

- stable world-space object IDs;
- cell-indexed render batches;
- near colliders only where interaction requires them;
- Tier-2 far silhouettes/roofs/walls rather than full objects;
- area asset manifest;
- NPC occupation/schedule hooks;
- nav/path graph;
- sparse persistent deltas when the world changes.

The settlement may span many streaming cells but **must not be generated independently per cell**. Cells are a runtime partition, not a town-planning algorithm.

---

# 4. SITE-SPECIFIC GRAMMARS

The same city generator must not merely shrink itself for camps.

## City / market town

Use road hierarchy + districts + coupled plots + dense frontage + civic landmarks + secondary lanes + inner yards.

## Village / hamlet

Use terrain interest field + road/building co-growth + looser irregular parcels + resource/water/farm relationships.

## Roadside inn / toll site

Road is dominant. Stable, yard, inn, well, hitching, guard/toll function form one dependency graph.

## Charcoal / logging camp

Resource extraction is dominant. Kilns, timber, cutting area, shelter, storage and tracks form an activity graph. It should look *worked*, not decorated.

## Bandit / military stockade

Defense graph is dominant: approach -> gate -> kill zone -> wall/towers -> command/sleep/storage -> alternate escape/service route where appropriate.

## Farmstead

House, barn, pens, fields, water and lane access determine the layout. Fields derive from usable land and parcel boundaries, not random rectangles.

## Monastery / shrine complex

Procession/circulation hierarchy, cloister/courtyard logic, service/agriculture zones and landmark visibility dominate.

## Ruin

Generate the intact semantic structure first, then apply a deterministic ruin/destruction transform. Never generate “random broken walls” without knowing what building or fortification used to exist.

## Dungeon entrance / mine

Surface logistics must imply the underground function: spoil heaps, carts, storage, timber, guards, drainage, roads and workforce areas should explain the portal.

## Interiors

Room function graph first; furniture/props second. Doors, work triangles, circulation and service relationships are hard constraints. WFC may add microvariation only after the semantic floor plan exists.

---

# 5. DETERMINISM, PERSISTENCE AND THE LIVING REALM

Settlement generation must compose with Alderwatch's existing realm mathematics.

Stable address hierarchy:

`realm -> region -> settlement -> district/zone -> parcel -> building -> grammar node -> prop story -> object`

Generation order must not matter.

Persistent world changes are sparse deltas over the deterministic base:

- burned building;
- rebuilt wall;
- new household occupation;
- market expansion;
- faction banner/control;
- abandoned workshop;
- grave/funeral marker;
- crime barricade;
- caravan arrival;
- famine-empty stall;
- player-built structure.

A settlement should be able to evolve without rerolling its unaffected geometry.

The living-realm compiler should eventually feed the charter and sparse deltas. Population, trade, danger, faction pressure and household history can alter which functional modules materialize while preserving stable identity.

---

# 6. PERFORMANCE LAW

Better procedural composition is not permission to explode runtime cost.

Generation should happen primarily:

- offline/build-time for major canonical cities;
- deterministically at area construction for modest sites where cheap;
- cached/serialized as compact semantic layout data when generation is expensive.

The output is still consumed by existing bounded rendering/simulation architecture.

Track:

- generated object count;
- unique geometry/material count;
- draw calls after batching;
- near collider count;
- nav nodes/edges;
- generation/compile time;
- active-cell cost;
- memory across travel;
- Tier-2 silhouette cost.

Do not ship a beautiful procedural city that makes the browser die.

---

# 7. COURT / ACCEPTANCE

A generator passing unit tests is not enough. It must survive a visual and functional Court.

For every settlement archetype under development, freeze at least 12 seeds/candidates and produce:

- top-down plan view;
- four cardinal approach views;
- two first-person street/path walks;
- night/readability view when applicable;
- graph/parcel diagnostic overlay;
- performance receipt.

Hard failures include:

- buildings floating or buried;
- inaccessible doors;
- roads through buildings;
- occupied parcel with no access;
- disconnected required function;
- prop collisions blocking navigation;
- implausible slopes;
- fence with no gate where circulation crosses it;
- wagon with no cart-width access;
- market/stable/industrial function with no believable service space;
- obvious cell-boundary composition seams;
- repeated prefab orientation that reads as stamping;
- generated city that still reads as “objects scattered on grass.”

Quantitative checks should include:

- circulation graph connectedness and required-node reachability;
- parcel street-access rate = 100% for occupied plots;
- door-to-road/path reachability = 100%;
- collision/intersection count = 0 outside intentional contacts;
- slope limits per archetype;
- frontage alignment distribution by district type;
- nearest-neighbor / orientation diversity bounds;
- landmark visibility from frozen approach points;
- minimum/maximum open-space ratios by archetype;
- runtime budgets.

The visual judge remains first-person play.

---

# 8. IMPLEMENTATION ORDER

## SG-0 — Compiler substrate

Build data-only modules first:

- `SettlementCharter`;
- `SettlementSuitabilityField`;
- `SettlementGraph`;
- `SettlementParcel` / `ActivityZone`;
- semantic dependency constraints;
- deterministic geometric solver;
- stable address/ID scheme;
- diagnostic SVG/canvas/top-down export for fast inspection.

No renderer rewrite.

## SG-1 — Charcoal Camp proof

Rebuild Wolfpine Charcoal Camp through the new activity-graph pipeline because it is small, currently visibly primitive and has clear functional requirements.

Acceptance: side-by-side before/after must be embarrassingly obvious.

## SG-2 — Bent Spear Stockade proof

Use a defensive-site grammar: terrain-aware palisade, gate approach, towers, inner circulation, barracks/storage/service zones, readable stronghold silhouette.

## SG-3 — Greyhaven city proof

This is the flagship macro test:

- King’s Road skeleton;
- market/civic center;
- planted-vs-grown morphology parameter;
- district graph;
- hierarchical street/parcel co-generation;
- medieval frontage/burgage logic;
- yards/back lanes;
- real occupations/interiors;
- living-realm citizen materialization into meaningful homes/workplaces.

If Greyhaven still looks procedural-toy after this, the compiler fails regardless of unit tests.

## SG-4 — Realm factory gate

**Stonewake, Giant’s Step, Greymoor, Blackfen and every later settlement must use the Settlement Compiler or an explicitly authored layout.**

No new region gets to ship another ad-hoc scatter-builder merely because expansion is moving quickly.

## SG-5 — Growth/history coupling

Let persistent realm state modify settlements through sparse semantic deltas:

- new houses/workshops;
- abandoned/burned parcels;
- fortification growth;
- market expansion/contraction;
- faction occupations;
- refugee camps;
- graves/aftermath;
- rebuilt roads/bridges.

World history should become visible in morphology.

---

# 9. THE TARGET

The target is not “procedural generation.” The target is **procedural authorship quality**.

A player entering a place should be able to infer why it exists, how people move through it, what work happens there, what grew first, what was added later, where goods arrive, where animals go, what the settlement fears, and what its wealth comes from — before reading a single UI panel.

That is the world-building standard.

The renderer can then make that world beautiful instead of making bad composition high-resolution.
