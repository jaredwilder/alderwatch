# Alderwatch Million-Actor Realm Proof

This document records the exact mathematical/runtime claim behind the first million-inhabitant Alderwatch realm layer. It is deliberately narrower and stronger than “we can allocate one million NPC objects.”

## Target

Maintain **1,048,576 persistent, individually addressable logical inhabitants** while keeping dormant-population simulation and active browser residency bounded independently of total realm population.

The proving layout is exact powers of two:

- realm population: `2^20 = 1,048,576`
- population shards: `2^8 = 256`
- inhabitants per shard: `2^12 = 4,096`
- active logical resident cap: `96`

A citizen identity is injectively addressed by a stable ordinal plus a deterministic checksum. The save does not contain one million citizen records.

## Exchangeability theorem

Let `S` be the eight-state citizen phase space and let a dormant population microstate be

`x = (x_1, ..., x_N) in S^N`.

For each admissible public realm input `a`, every dormant citizen follows the same deterministic local transition

`T_a : S -> S`

and contributes an additive public output

`r_a : S -> Z^6`

(food, iron, defense, trade, casualties, unrest).

Define the histogram morphism

`H(x)_s = |{ i : x_i = s }|`.

Because the public transition is componentwise and citizen labels do not enter it,

`H(T_a^N(x)) = M_a H(x)`

for the induced count-transfer operator `M_a`, and

`Y_a(x) = sum_i r_a(x_i) = R_a H(x)`.

Therefore, if two hidden microstates have the same histogram, they have the same next histogram and the same public output under every allowed input. By induction on any future input word, they have identical future public traces.

Equivalently: the action is invariant under the symmetric group `S_N`, and the histogram is the orbit coordinate of the unseen population.

This is an exact bisimulation/quotient statement for the declared dormant-population interface, not an approximation.

## Ordered history composition

A single public event is represented by a finite transducer block carrying, for every start phase:

- ending phase;
- additive output accumulated during the event.

Ordered block composition is

`(F,G) star (F',G') = (F' o F, G + G' o F)`.

This is the same semidirect ordered-summary structure used by the earlier World Capsule work. It is associative and generally non-commutative. A long event history can therefore be compiled once and applied to an entire cohort in `O(|S|)` work rather than replayed once per citizen.

## State-space collapse

The unreduced microstate space for one million inhabitants has

`8^1,048,576`

ordered states.

Permutation orbits are histograms. Their count is the stars-and-bars value

`C(1,048,576 + 7, 7)`

which is exactly

`276554324146871386263159553709685604353`.

That quotient state space is still enormous as a *set of possibilities*, but one actual quotient state is represented by only eight integer counts. Storage for the active state therefore grows as `O(|S| log N)`, not `O(N)`.

## Stable individual identity

Exchangeability does not mean citizens cease to exist.

Every logical inhabitant has a stable `(seed, ordinal)` identity and can be reconstructed in O(1):

- persistent ID;
- home shard/local ordinal;
- deterministic identity bits;
- initial phase;
- current dormant phase through the accumulated lineage map.

The ordinal is embedded in the ID, so identity is injective by construction rather than probabilistically collision-free.

## Sparse named exceptions

The quotient is valid only while citizens are exchangeable under the declared public interface.

As soon as gameplay gives one inhabitant unique state — conversation history, wounds, quest ownership, inventory, a personal relationship, a crime, a player-caused mutation — that inhabitant is **promoted before mutation**:

1. remove exactly one unit from the corresponding bulk initial/current phase counts;
2. persist the stable citizen record explicitly;
3. evolve that named exception independently thereafter.

The authoritative representation is therefore

`bulk histogram + sparse named exceptions`.

The total population remains exactly conserved. Named people are never averaged back into the bulk automatically.

This is the game implementation of the estate rule that exceptional semantic content must not be laundered into a derived summary.

## Bounded materialization

`PopulationBubble` materializes at most 96 logical residents from the current 4,096-person shard. Named exceptions are preferred, then deterministic anonymous residents fill the remaining budget.

The active count is independent of:

- total realm population;
- number of population shards;
- dormant history length;
- distance to the highest logical citizen ordinal.

A billion-inhabitant synthetic realm uses the same active cap and the same eight-state bulk operator.

## Court

`tests/million-actor-realm.test.ts` requires:

1. **Exhaustive exchangeability Court** — all `8^5 = 32,768` ordered five-person microstates, under all seven public inputs. Direct micro simulation must equal histogram simulation in both output and successor quotient; every permutation orbit must be behaviorally coherent.
2. **Ordered history exactness** — compiled event blocks equal sequential individual replay.
3. **Million identity contract** — exact 1,048,576 population, exact 256x4,096 hierarchy, balanced phase basis, injective random-access IDs, and kilobyte-scale unmodified save certificate.
4. **Population-independence Court** — 1,024, 1,048,576 and 1,000,000,000 inhabitants receive the same 10,000-day event history and must consume the same bulk certificate work units.
5. **Sparse-exception Court** — individually mutated named citizens plus bulk certificate must exactly equal a full 64-person micro simulation across 365 days.
6. **Active-residency Court** — million/billion logical address spaces may never exceed the 96-resident active bubble cap.
7. **Shard basis Court** — selected 4,096-person shards have exact balanced initial phase counts without enumerating the realm.

## What this proves

Under the declared dormant-population interface:

- logical population count does not determine browser simulation cost;
- dormant citizens remain persistent and random-access addressable without one-record-per-person storage;
- symmetric dormant life admits an exact histogram quotient;
- long histories compose exactly through ordered finite transducers;
- individually meaningful lives can split out as exact sparse exceptions;
- active population residency can remain hard-bounded while logical population grows by orders of magnitude.

## What this does **not** prove yet

This is not yet one million full AI agents with unrestricted private memories, arbitrary inventories, pairwise relationships, unique schedules and simultaneous pathfinding. Those semantics would violate the current exchangeability assumptions unless they are either:

- added to the finite citizen state/boundary interface;
- represented by a richer compositional certificate; or
- promoted to sparse explicit exceptions.

The next scaling problem is therefore not “spawn more objects.” It is to enrich the sufficient state while keeping its boundary dimension small, then materialize commercially convincing local crowds from it.
