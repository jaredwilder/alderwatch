# Alderwatch Living Realm Ledger

This is the durable delivery ledger for the enormous-living-realm program. It records what exists, what the math actually guarantees, what is merely an engineering bound, what is player-facing, and what remains open. It is not a replacement for `GAME_REQUEST_LEDGER.md`; concrete player requests still belong there too.

## North-star contract

Alderwatch should behave like one enormous persistent medieval realm while browser runtime cost stays tied to what is locally materialized, not to total world address space, total historical depth, or total logical population.

Core doctrine:

> One enormous persistent realm in game-state terms. One aggressively bounded simulation/render bubble in runtime terms.

No claim in this ledger means “one million unrestricted full-AI agents.” The architecture deliberately changes representation across scale.

## Realm-scale invariant stack

| Layer | Large logical object | Runtime / certificate bound | Exactness contract |
|---|---:|---:|---|
| Area streaming | Arbitrarily many loadable areas | One active major area | Outgoing area state saved before replacement |
| Crownroad cell streaming | 169 addressable cells | 9 materialized cells | Deterministic random-access cell identity |
| Deep Iron dungeon | 24 persistent rooms | 7 active rooms | Graph-stream budget independent of total room count |
| Hidden Lower Works | 16,384 microstates | 576-state cut certificate | Exhaustive boundary trace equivalence |
| Realm population | 1,048,576 logical citizens | 96 generic active-resident global cap; Crownroad presentation cap 18 | Stable injective citizen identity; exact bulk accounting plus sparse named exceptions |
| Household society | 262,144 four-person households | Exact 330 household orbit types | 8^4 family microstate Court |
| Household relation graph | 393,216 deterministic ties | O(1) degree per household | Stable trade/rival/oath relation identities |
| Social boundary | 256 wards | 256-state kin/market/watch/guild certificate per segment | Ordered compositional transducer |
| Social routing | 256 wards | O(log wards) range fragments | Forward/reverse route equals literal ordered traversal |
| Canonical history | Unbounded promised archive H | O(H) archive; max 64 live propagating rumors | Exact causal source/provenance retained |
| Causal consequences | Arbitrarily many historical atoms | O(actors + touched households + <=256 pressure slots) summary | Replay is idempotent; exact atom remains source of each compiled consequence |
| Crownroad residents | Drawn from 1,048,576 stable identities | <=18 rendered bodies | Rendering does not itself promote/mutate a citizen |

## Delivered milestone history

### Realm runtime / world capsules

- **PR #47** established area lifetime management, deterministic random-access world addressing, Morton cell identity and the first exact HUMU-style offscreen settlement capsule Court.
- Key principle established: ordered event summaries can replace tick replay only when their boundary behavior is exact for every declared start state.

### Ironward expansion

- **PR #50** created the physical `Far March -> Ironward Crossing -> Ironward Basin` route.
- Ironward Basin is a 336m x 336m, 7x7 addressable cell field with a 3x3 resident cell window.
- Gatewatch receives persistent offscreen simulation using compiled world blocks rather than replaying every hidden day.

### Deep Iron / nested hidden worlds

- **PR #54** added Deep Iron Mine with 24 persistent dungeon rooms and a hard seven-room materialization budget.
- The Lower Works Court exhausts 16,384 hidden microstates and validates a 576-state sufficient cut certificate.
- This is the strongest current example that a hidden world interior can collapse to a much smaller exact boundary representation.

### Million-person realm

- **PR #57** added exactly 1,048,576 stable logical citizen identities across 256 wards of 4,096 citizens.
- Population evolution operates on exact phase histograms plus sparse named exceptions.
- A resident bubble is hard-capped; logical population size does not imply one object or one AI brain per citizen.
- Synthetic 1K / 1M / 1B population tests established equal certificate work for the bulk model under the declared phase-state contract.

### Household society / separator math

- **PR #62** grouped the realm into 262,144 deterministic four-person households.
- Every household has stable trade, rival and oath ties, yielding 393,216 deterministic relation edges without a quadratic social graph.
- Four-channel ward summaries (`kin`, `market`, `watch`, `guild`) compile into exact 256-state social boundary certificates.
- Ordered separator composition is noncommutative and associative; tree repair after a sparse ward change is logarithmic.
- Gatewatch Chronicle made the social layer visible in the game.

### Canonical causal history / Crownroad Vale

- **PR #70** converged player deeds, simulated-player deeds and consequential NPC/world relay speech into one canonical history.
- Canonical atoms preserve exact source actor IDs/names and are deduplicated by external keys.
- Scheduled structural history includes marriage, birth/lineage, migration, faction succession, grudge and rumor events.
- Active propagating rumor state is explicitly capped at 64 while canonical archive facts remain retained.
- Provenance is lifted as a product label across compressed social certificates: social signal transforms, source atom identity does not.
- Bidirectional social routing was Court-tested against literal traversal.
- **Crownroad Vale** added a 13x13 / 169-cell major region, ~624m across, with only nine cells materialized at once.
- Physical route became `Far March -> Ironward Crossing -> Ironward Basin -> Crownroad Vale`, with Deep Iron branching below Ironward.
- Crownroad landmarks include Greyhaven, Saint Orra's Bridge, Carters' Rest, Bellmere, Northwatch, Blackbarrow Ruin, Abbey of Saint Vellum and King's East Gate.
- First-time POI discovery writes player-sourced history.

### Current PR: consequences become gameplay

Branch: `feat/causal-consequences-living-ledger`.

This round adds the reverse arrow:

`accepted action / consequential speech -> canonical atom -> separator propagation -> bounded consequence summary -> NPC/world response`

Implemented in this PR:

- `realm-consequences.ts` compiles new canonical atoms exactly once using the atom's stable sequence embedded in its ID.
- Ward pressure is four-channel and time-decaying rather than an ever-growing counter.
- Actor consequence state stores deeds, helpful/hostile counts, channel activity and at most sixteen district trust echoes.
- Remote reputation heard back in Alderbrook is kept separate from ordinary `RenownState`; it does not double-pay the original gameplay action.
- Directly touched households store sparse exact actor-memory edges only when a canonical atom explicitly names that household.
- Existing NPC standing consumes the road-borne faction echo as additional social context.
- Player, NPC and simulated-player canonical bridges compile consequences immediately after successful canon promotion.
- Crownroad population presentation now draws real deterministic citizen identities from the million-person population layer.
- Greyhaven may materialize up to 18 resident bodies; rural cells materialize fewer. The hard cap is 18.
- Resident bodies use the adult survivor rig, deterministic clothing/appearance, deterministic personal display names, exact household affiliation and live phase-derived roles.
- Rendering a citizen does **not** create a sparse exception. A citizen is promoted only on explicit player contact.
- Speaking to a Crownroad resident creates an exact canonical encounter edge to that citizen and household.
- Resident greeting reads compiled district reputation plus direct household memory.
- Crownroad cell dressing reads current ward pressure: watch pressure can stage defenses, market pressure can stage wagons/barrels, guild pressure can stage working stock, kin pressure can stage agrarian clutter.
- Crownroad HUD exposes bounded resident count, remembered actor count, live rumor threads and current four-channel ward pressure.

## Representation law used throughout

Alderwatch does not ask one representation to serve every scale.

Current representation ladder:

`FULL ACTOR -> CHEAP LOCAL AGENT -> HOUSEHOLD / POPULATION QUOTIENT -> SOCIAL BOUNDARY CERTIFICATE -> CANONICAL HISTORY + CONSEQUENCE SUMMARY`

A representation change is permitted only with an explicit contract describing:

1. what is conserved;
2. what is intentionally forgotten;
3. how an object is reconstructed/materialized;
4. which queries/actions remain valid at the coarser level;
5. what forces promotion back to a finer representation.

Named exceptions are not failures of compression. They are the deliberate escape hatch for uniqueness.

## Causal-history storage doctrine

There is no promise of free retrospective succinctness.

If Alderwatch promises to remember H unique historical facts, the canonical archive may require O(H) storage. Runtime propagation is bounded separately:

- canonical archive: O(H);
- active rumor frontier: <=64;
- consequence recent feed: <=32;
- actor echo: O(number of consequential actors), with <=16 district trust values per actor;
- household memory: O(number of explicitly touched households / actor edges);
- ward pressure: <=256 records and four channels each.

This distinction is load-bearing. We compress behavior, not promised history out of existence.

## Current Courts / falsification gates

The realm-scale suite now includes checks for:

- 4,000 adversarial World Capsule sequences vs sequential replay;
- all 16,384 Lower Works microstates against the cut certificate;
- million-population accounting and synthetic scale invariance;
- all 8^4 ordered household phase assignments;
- all 256 social boundary states;
- exact ordered forward/reverse separator ranges;
- arbitrary provenance labels through compressed social routes;
- 200 same-day external canonical events with <=64 live rumor threads;
- 5,000 days of structural history with lineage/migration/succession/grudge invariants;
- migration + matured-descendant population conservation;
- sparse social-tree repair vs complete rebuild;
- 169 Crownroad cells with <=9 resident cells;
- consequence replay idempotence and bounded actor/district/pressure state;
- 1,000 canonical deeds compiled into summary-sized consequence state;
- deterministic Crownroad citizen materialization with <=18 rendered residents;
- no citizen promotion merely from rendering.

CI and live play remain separate acceptance gates. A green Court proves the declared contracts, not aesthetic quality, FPS on the user's browser, or fun.

## Player-facing causal loops now possible

These are no longer separate architectural inventions; the substrate exists to connect them:

- do a famous deed in Crownroad -> rumor route carries it west -> Alderbrook NPC standing may recognize it;
- touch a specific household -> exact household memory edge persists;
- enter a new Crownroad cell -> anonymous population quotient materializes stable citizens -> direct contact promotes only the touched person;
- sustained watch/market/guild/kin activity -> current ward pressure changes -> Crownroad physical staging changes;
- simulated player completes a canon-worthy authoritative action -> same history and consequence path as the human player;
- consequential NPC relay speech -> exact NPC source atom -> same propagation / consequence compiler.

## Open fronts — do not mark shipped yet

1. **Live browser acceptance of Crownroad resident visuals.** Confirm bodies render cleanly, do not tank FPS, and do not overlap authored structures badly.
2. **Resident collision / navigation.** Current resident presentation is bounded animated local wandering, not full navmesh citizen AI.
3. **Deep household reciprocity.** Household memory exists; contracts, gifts, shelter, rescue and vendetta mechanics should write explicit positive/negative household edges.
4. **Faction leadership consequences.** Succession is historical state today; faction services, patrol makeup and quests should respond to the current leader.
5. **Migration materialization.** Migrated households change exact population accounting; settlement presentation should visibly gain/lose households when materialized.
6. **Economic consequence.** Market pressure currently affects staging; prices, stock and caravan routes need authoritative bounded response rules.
7. **Crime / justice propagation.** Negative player deeds should generate exact witness/source chains, geographic propagation and jurisdiction-specific standing.
8. **Crownroad gameplay depth.** Add contracts, enemies, gathering, loot, interiors and local NPC services so it is more than traversal/social proof.
9. **King's East Gate.** The gate is intentionally unopened. Next major-region expansion should continue from it rather than teleporting to an unrelated map.
10. **Measured performance.** Record transition time, draw calls, texture/geometry memory and FPS in representative Far March / Ironward / Crownroad scenes. Do not claim record-setting performance without measurement.
11. **Save growth / compaction policy.** Canon history is allowed to grow because retrospection is promised; define archive epochs/export/compaction only where semantics permit it.
12. **Multiplayer-ready authority split.** Current `LocalAuthority` contracts are useful seams; future network authority must preserve stable IDs and causal-source validation.

## Expansion fronts

Near-term physical world graph:

`Far March -> Ironward Crossing -> Ironward Basin -> Crownroad Vale -> King's East Gate -> [next region]`

with:

`Ironward Basin -> Deep Iron Mine -> deeper nested interiors`

Do not expand by making every loaded map gigantic. Add addressable realm space while preserving bounded local materialization.

## Delivery status language

Use these labels strictly:

- **IMPLEMENTED / CURRENT PR** — code exists on an open PR; CI/live acceptance may still fail.
- **MERGED / AWAITING LIVE PLAY** — code is on main but player-facing behavior has not been directly accepted.
- **LIVE ACCEPTED** — user directly confirmed the relevant behavior in the running game.
- **COURT-PROVED** — the declared mathematical/software invariant passed its falsification suite; this does not imply live visual acceptance.
- **OPEN** — desired causal/gameplay loop is not yet complete.

Never replace one of these with “shipped” merely because the code is impressive.
