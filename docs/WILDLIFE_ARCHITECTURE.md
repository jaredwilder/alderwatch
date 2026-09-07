# Wildlife architecture

Alderwatch wildlife is intentionally split by responsibility so adding a joke item, new herd animal, aerial predator, or food-web interaction does not turn one renderer file into the game's rules engine.

## Ownership

| Module | Owns | Must not own |
| --- | --- | --- |
| `src/wildlife-species.ts` | Species type, health, loot, model height, movement tuning, predator/prey relationships, combat tuning, aerial tuning | Scene objects, spawn coordinates, inventory mutation |
| `src/wildlife-spawns.ts` | Stable additive animal IDs, authored encounter positions, population/pack caps, pack membership | Steering, damage, rendering |
| `src/wildlife-ai.ts` | Pure target selection, herd/pack steering, interference decisions | Health mutation, carcass creation, Three.js objects |
| `src/wildlife-aerial.ts` | Aerial energy, takeoff/landing, carry ownership, pickup/release rules, grounded reachability | Scene objects, spawning, combat damage |
| `src/wildlife-rules.ts` | Authoritative health, damage, death, carcass loot, predator-vs-player combat | Wandering/spawn placement/render animation |
| `src/animal-models.ts` | GLB loading, cloning, forward-axis calibration, size normalization, semantic clip lookup | Gameplay health/AI |
| `src/nature.ts` | Runtime orchestration, movement integration, terrain avoidance, animation selection, legacy hare/crow presentation | New per-species tuning tables |
| `scripts/fetch_animals.mjs` | Pinned reproducible licensed asset downloads | Live runtime CDN dependencies |

`WorldState.animals` stores `AnimalState` from `wildlife-species.ts`, not a renderer-owned type. Presentation can disappear without changing authority/state ownership.

## Adding a species

1. Add the `AnimalKind` and exactly one `WILDLIFE_SPECIES` row.
2. If it is an authored moving animal, add a licensed/pinned GLB fetch and provenance. `animal-models.ts` discovers authored species from the registry.
3. Add stable spawn rows in `wildlife-spawns.ts`; never rename existing IDs in a save-compatible release. Add/export an explicit population invariant for deliberately scarce species.
4. Add a pure AI/domain helper only when behavior is genuinely new. Prefer data in the species row over `if(kind===...)` branches.
5. Use `wildlife-rules.ts` for new damage/death ownership. Never create loot directly from the renderer.
6. Add regression coverage for the species invariant, interaction, persistence, and any pack/herd/energy constraints.

## Predator contract

Predator/prey relationships are declared in the species registry. `predatorTarget()` and `predatorThreat()` consume that data, so prey selection and fear agree by construction.

Wolf packs use stable `packId` values from the spawn table. No pack-manager singleton is required: `packMembers()` is deterministic, and `wolfFlankPoint()` assigns approach geometry from stable member ordering. Pack aggression is propagated through explicit `aggroPlayerId`/`aggroUntil` state, so save/debug snapshots expose why a wolf is hostile.

**Wolf pack hard limit: 3.** `MAX_WOLF_PACK_SIZE` is an exported invariant and tests fail if authored spawn data exceeds it.

## Aerial predator contract

Aerial ecology is additive state, not a second wildlife engine. `wildlife-species.ts` declares energy/carry tuning; `wildlife-aerial.ts` owns transitions such as pickup, release, exhaustion, landing and takeoff; `nature.ts` only integrates those decisions into world movement and animation.

Ground predators may target an aerial species only while it is actually grounded. Carried prey has one explicit `carriedById` owner and the carrier has one `carriedPreyId`; cleanup on release/death prevents dangling ownership. Aerial exhaustion is intentionally persistent across saves, so reloading never refills a tired eagle.

**Eagle population hard limit: 3.** Eagles are territory encounters, not ambient spam. Expensive food-web hunting is player-proximity gated so off-screen simulation does not silently erase the prey population.

## Non-animal ecology

World resources such as wild beehives should reuse existing authority-owned records when their lifecycle matches an existing domain. Beehives are persistent `ForageState` records producing `wild_honey`; their skep/bee mesh is presentation only. This keeps honey collection, cooldown and inventory mutation in the same command authority as mushrooms/herbs instead of creating a `BeeManager` or per-frame bee simulation.

## Save compatibility

Wildlife seeding is additive (`??=`): a known animal's transform, health, death, loot, hunt state, pack aggro, energy, or carry state is never reset just because the roster grows. New optional `AnimalState` fields require no save-version bump. A save-schema bump is reserved for incompatible state meaning/shape changes, not new additive wildlife.

## Test gates

Every wildlife content pass must keep these green:

- species registry completeness;
- authored population and pack-size invariants;
- additive seeding/persistent health;
- predator target/reachability relationships;
- aerial carry/energy/release invariants when applicable;
- combat/death/carcass ownership tests;
- persistent resource cooldown tests for ecology objects such as beehives;
- `npm test`;
- `npm run build`, which also exercises the pinned animal download path on a fresh runner.
