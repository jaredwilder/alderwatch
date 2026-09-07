# Wildlife architecture

Alderwatch wildlife is intentionally split by responsibility so adding a joke item, new herd animal, or predator does not turn one renderer file into the game's rules engine.

## Ownership

| Module | Owns | Must not own |
| --- | --- | --- |
| `src/wildlife-species.ts` | Species type, health, loot, model height, movement tuning, predator/prey relationships, combat tuning | Scene objects, spawn coordinates, inventory mutation |
| `src/wildlife-spawns.ts` | Stable additive animal IDs, authored encounter positions, pack membership | Steering, damage, rendering |
| `src/wildlife-ai.ts` | Pure target selection, herd/pack steering, interference decisions | Health mutation, carcass creation, Three.js objects |
| `src/wildlife-rules.ts` | Authoritative health, damage, death, carcass loot, predator-vs-player combat | Wandering/spawn placement/render animation |
| `src/animal-models.ts` | GLB loading, cloning, forward-axis calibration, size normalization, semantic clip lookup | Gameplay health/AI |
| `src/nature.ts` | Runtime orchestration, movement integration, terrain avoidance, animation selection, legacy hare/crow presentation | New per-species tuning tables |
| `scripts/fetch_animals.mjs` | Pinned reproducible licensed asset downloads | Live runtime CDN dependencies |

`WorldState.animals` stores `AnimalState` from `wildlife-species.ts`, not a renderer-owned type. Presentation can disappear without changing authority/state ownership.

## Adding a species

1. Add the `AnimalKind` and exactly one `WILDLIFE_SPECIES` row.
2. If it is an authored moving animal, add a licensed/pinned GLB fetch and provenance. `animal-models.ts` discovers authored species from the registry.
3. Add stable spawn rows in `wildlife-spawns.ts`; never rename existing IDs in a save-compatible release.
4. Add a pure AI helper only when behavior is genuinely new. Prefer data in the species row over `if(kind===...)` branches.
5. Use `wildlife-rules.ts` for new damage/death ownership. Never create loot directly from the renderer.
6. Add regression coverage for the species invariant, interaction, persistence, and any pack/herd constraints.

## Predator contract

Predator/prey relationships are declared in the species registry. `predatorTarget()` and `predatorThreat()` consume that data, so prey selection and fear agree by construction.

Wolf packs use stable `packId` values from the spawn table. No pack-manager singleton is required: `packMembers()` is deterministic, and `wolfFlankPoint()` assigns approach geometry from stable member ordering. Pack aggression is propagated through explicit `aggroPlayerId`/`aggroUntil` state, so save/debug snapshots expose why a wolf is hostile.

**Wolf pack hard limit: 3.** `MAX_WOLF_PACK_SIZE` is an exported invariant and tests fail if authored spawn data exceeds it.

## Save compatibility

Wildlife seeding is additive (`??=`): a known animal's transform, health, death, loot, hunt state, or pack aggro state is never reset just because the roster grows. New optional `AnimalState` fields require no save-version bump. A save-schema bump is reserved for incompatible state meaning/shape changes, not new additive wildlife.

## Test gates

Every wildlife content pass must keep these green:

- species registry completeness;
- authored pack-size invariants;
- additive seeding/persistent health;
- target relationship tests (for example wolf -> bison);
- combat/death/carcass ownership tests;
- `npm test`;
- `npm run build`, which also exercises the pinned animal download path on a fresh runner.
