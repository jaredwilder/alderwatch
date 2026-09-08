# Alderwatch Provenance Frontier Court

This note records the next realm-scale theorem after the million-person population quotient and the 256-state social separator.

## Goal

Let Alderwatch acquire facts that **must not** be averaged away:

- a rumor with a known source,
- a witnessed marriage,
- a child with named parent households,
- a household migration,
- a faction succession with causal ancestry,
- a grudge created by history or eventually by the player.

These semantics break pure exchangeability. The answer is not to abandon compression and instantiate one million social agents. The answer is to keep the exchangeable bulk and make the non-exchangeable support explicit.

The authoritative representation is therefore:

`compressed society + sparse causal frontier + retained canon atoms`

## 1. Provenance product lift

A social separator certificate is a deterministic transducer

`C : B -> B x D`

where `B` is the 256-state ward boundary space and `D` is the public social delta.

Let `P` be an arbitrary provenance-label set: atom IDs, source household IDs, future quest IDs, or any other opaque identity that the social dynamics do not modify.

Define the lifted machine

`C~ : B x P -> B x D x P`

by

`C~(b,p) = (C_B(b), C_D(b), p)`.

The provenance coordinate is carried by the identity map. Therefore unique provenance does **not** widen the 256-entry social transition table. If the base separator is exact, the lifted separator is exact for every provenance label.

The Court checks all 256 boundary states with multiple distinct provenance labels and requires identical social behavior plus bit-for-bit preservation of the label.

## 2. Exact ordered range certificates

The social separator tree now supports ordered interval queries. For ward interval `[l,r)` it collects only the canonical segment-tree fragments that cover the interval, composing left fragments and right fragments in the correct noncommutative order.

For `W` wards, an interval is represented by `O(log W)` tree fragments. The interior wards are not replayed.

A second tree built in reverse order gives the same guarantee for reverse travel. Thus a rumor from source ward `s` to target ward `t` obtains an exact route certificate in logarithmic tree work after the hierarchy exists.

The Court compares hundreds of forward and reverse route certificates against literal ward-by-ward propagation and requires exact boundary signal, exact public delta, and exact segment count.

## 3. Sparse-support historical rank

Define the current **historical support rank** `k` as the number of explicit structural patches, born descendants, faction-leadership pointers, and active rumor packets.

This is a support-size notion, not matrix rank.

The million-person base remains implicit. A structural event adds only the support that became semantically distinguishable:

- marriage: symmetric household-pair override,
- grudge: symmetric sparse edge,
- migration: household -> current ward override,
- birth: stable new descendant identity + parent-household pair,
- succession: faction -> current leader pointer + parent succession atom,
- rumor: source atom + source household + finite social signal.

Base household IDs, citizens and deterministic trade/rival/oath edges are unchanged.

## 4. Finite-support perturbation of geography

A migrated household does not require rebuilding a million-person population. Its four current members are subtracted from the base ward histogram and added to the destination ward histogram.

When a sparse descendant reaches adulthood, one supplemental laborer contribution is added to the household's current ward. The immutable `2^20` base identity address space remains unchanged.

A migration changes only the old/current/original ward leaves touched by that patch. Each changed leaf repairs `O(log W)` separator ancestors.

For `k` changed wards the update cost is therefore `O(k log W)`, not `O(N)` in citizens.

The Court mutates a migration in a live historical state, repairs only the affected leaves, and requires the resulting root certificate to equal a complete rebuild exactly.

## 5. Bounded active rumor frontier

At most one promoted historical event is emitted per realm day. Each active rumor expires after `T = 12` days.

Therefore

`|activeRumors| <= T`

by construction.

Each active rumor carries one unique provenance label and one finite boundary signal. Its route query is logarithmic in ward count. Active rumor cost is consequently bounded independently of total population.

The Court advances ten thousand realm days and requires the active frontier never to exceed the TTL bound.

## 6. Canon is not free

This layer deliberately **does not** claim constant-size exact retrospective history.

If Alderwatch promises that a player may later ask who married whom, who first spread a particular warning, or which succession preceded another, those facts contain information and must be retained somewhere.

`HistoricalAtom` is that retained canon ledger. It grows with the number of promoted historical facts `H`, not with the million-person population `N`.

So the intended asymptotics are:

- dormant bulk simulation: independent of `N`,
- active causal frontier: `O(k)`, with rumors hard-bounded by TTL,
- local separator repair: `O(k log W)`,
- exact canon archive: `O(H)` promoted historical facts.

This is the no-free-retrospective-succinctness rule made architectural rather than rhetorical.

## 7. Current semantics and explicit frontier

Implemented in this Court:

- sourced rumors with preserved atom provenance,
- symmetric marriages/remarriages,
- stable born-descendant IDs and parent households,
- household migration without identity replacement,
- faction succession with causal parent atoms,
- explicit mutual grudges,
- migration-aware ward demography,
- adulthood contributions as sparse supplemental workforce,
- Gatewatch Chronicle provenance display.

Not yet claimed:

- arbitrary per-person friendship networks,
- exact person-by-person rumor transmission chains,
- inherited property/inventory law,
- births automatically materialized as full local Character actors,
- deaths and inheritance,
- large wars with individual military trajectories,
- arbitrary player-created social mutations wired into gameplay actions.

Each of those must either become a new sufficient coordinate or be added to the explicit sparse frontier before gameplay is allowed to distinguish it.

## Court targets

1. Ordered range certificates match literal forward/reverse ward traversal.
2. Provenance product lift preserves arbitrary labels exactly for all 256 boundary states.
3. 10,000-day history keeps the active rumor frontier within the 12-day bound.
4. All six historical event kinds occur under deterministic long-horizon schedules.
5. Causal atom graph is acyclic and succession ancestry resolves.
6. Marriage/grudge/lineage structural invariants remain exact.
7. Migration plus matured descendants preserves global demographic accounting.
8. Sparse migration leaf repair equals a complete separator rebuild.
9. Gatewatch rumor routing retains the exact source atom while using logarithmic range fragments.

The acceptance claim is narrow but important: **semantic rank may grow without forcing browser cost back to one-million-agent simulation, provided newly distinguishable information is promoted onto an explicit sparse frontier and the bulk is only queried through proven sufficient interfaces.**
