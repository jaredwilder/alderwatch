# Million-Actor Realm Court

The executable Court for the million-actor population layer lives in:

- `tests/million-actor-realm.test.ts`
- `tests/realm-population-save.test.ts`

The Court is intentionally layered:

1. **Local quotient exactness** — exhaustive ordered microstates for a small population prove the histogram morphism preserves every declared public output and successor quotient under every public input.
2. **History composition** — ordered event summaries equal sequential replay.
3. **Million-person identity** — 1,048,576 stable injective logical identities exist without a million-row save.
4. **Scale invariance** — 1K, 1M and 1B populations consume identical certificate work under the same 10,000-day history.
5. **Sparse exception exactness** — individually mutated named citizens remain exact when split from the bulk certificate.
6. **Residency bound** — the logical materialization bubble never exceeds 96 residents.
7. **Persistence** — the population layer migrates additively into existing version-1 realm saves and catches up from authoritative world tick idempotently.

The claim under test is not that one million unrestricted AI brains are simulated. The claim is that one million persistent logical identities can inhabit the authoritative realm while dormant symmetric behavior is represented by an exact quotient and active residency remains bounded.
