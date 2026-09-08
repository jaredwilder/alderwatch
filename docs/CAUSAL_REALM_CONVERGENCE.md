# Causal Realm Convergence — proof contract

This round joins Alderwatch's scale proofs to gameplay. The realm already has bounded spatial streaming, exact offscreen blocks, a million-address population quotient, household structure, and fixed-width social separators. The new problem is harder: **unique player/NPC history breaks exchangeability**.

## Runtime statement

Alderwatch now treats history as two layers:

1. **compressible bulk society** — million-person population, households, wards and 256-state social boundary certificates;
2. **sparse causal frontier** — facts whose identity/provenance future gameplay is allowed to distinguish.

The intended cost law is therefore not `O(population)` and not `O(all possible relationships)`:

`runtime social cost = bulk certificate work + active causal rank`

The active rumor frontier has an explicit cap of 64. Canonical archive size grows with facts actually promoted into history. This is deliberate: exact retrospective provenance contains information and has no free constant-size representation.

## Provenance product lift

A social segment certificate is a finite transducer

`C : B -> B × D`

where `B` is one of 256 kin/market/watch/guild boundary states and `D` is the public social delta.

For arbitrary unique provenance `p`, the runtime uses

`C~(b,p) = (C_B(b), C_D(b), p)`.

The compressed interior transforms the social signal while leaving the exact source label untouched. This is the core separation that lets one sourced rumor traverse a compressed district without materializing the citizens who carried it.

## Ordered logarithmic routing

`SocialSeparatorTree.range(start,end)` returns an exact ordered certificate for a ward interval using segment-tree fragments. Because social composition is generally noncommutative, left and right accumulators preserve order. A second reversed tree supports routes in the opposite geographic direction.

For 256 wards, the Court compares random forward/reverse routes with literal ward-by-ward traversal and requires at most 18 selected tree fragments.

## Structural exception frontier

The following semantics are now explicit sparse state rather than silently averaged:

- witnessed marriages, including symmetric remarriage unlinking;
- births with stable causal IDs and parent households;
- household migration without changing household identity;
- faction leadership and succession ancestry;
- mutual grudges;
- player/NPC/simulated-player deeds promoted by authoritative gameplay or consequential chat.

Mature descendants supplement the demographic certificate; they do not rewrite the immutable 1,048,576-address base population.

## Authority convergence

The canonical action bridge observes `LocalAuthority.dispatch` **after** the existing command succeeds. Rejected gameplay cannot create canon. Selected meaningful successes — construction, crafting, rare forage, bounty claims, expedition reports, guarded-cache discoveries and enemy deaths — can become sourced historical atoms. Simulated players already use the same authority, so their real actions enter the same history layer without a second simulation.

The social bridge listens to the existing simulated-player/NPC relay and promotes only consequential speech patterns. Source kind and actor ID are retained. The existing chat system remains responsible for conversation; the history layer is responsible only for canonical consequences.

## Crownroad Vale scale proof

Crownroad Vale is the next major loadable region:

- 13 × 13 deterministic cells = **169 addressable cells**;
- 48 m cells over a ~624 m square region;
- `CellWindow` radius 1 = **hard maximum 9 materialized cells**;
- named authored destinations: Greyhaven, Saint Orra's Bridge, Carters' Rest, Bellmere, Northwatch, Blackbarrow Ruin, Abbey of Saint Vellum and King's East Gate;
- physical travel from Ironward Basin's eastern kingroad;
- independent saved position;
- POI discoveries promote exact player-sourced canon;
- HUD projects the local ward's live provenance route and historical accounting.

Logical region size therefore increases by 169 cells while the area streaming envelope remains nine.

## Court claims

The new tests attack:

1. exact forward and reverse ordered range certificates;
2. arbitrary provenance labels across all 256 boundary inputs;
3. the explicit 64-thread active causal bound under 200 same-day external events;
4. deduplication and exact actor provenance for external canon;
5. all structural event kinds plus causal succession ancestry;
6. global demographic accounting after migration and matured births;
7. sparse separator repair versus complete rebuild;
8. exact source preservation when a rumor reaches Gatewatch;
9. 169 unique Crownroad cell addresses with max-nine residency;
10. independent Crownroad save-position round trip;
11. shared player/simulated-player authority-to-canon mapping.

## Non-claims

This round does **not** claim that every line of chatter is permanent canon, that the canonical archive is constant-size, that Crownroad's 169 cells are all rendered simultaneously, or that one million people run unrestricted per-person AI. It proves a stronger practical architecture: unique history can coexist with a compressed million-person realm without forcing the whole world back into microscopic simulation.
