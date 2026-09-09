# Observer Detail Field — Research Proofs 1–2

Goal: increase *perceived* world detail faster than resident world cost.

## Proof 1 — compact detail synthesis

1. **Nested deterministic vegetation population** — the original shared grass clump grew from 40 to 88 curved blades without multiplying JS grass objects.
2. **Aperiodic multiscale ground synthesis** — field/litter textures are sampled in decorrelated rotated domains with continuous coordinate warping and observer-faded micro-normal detail.
3. **Observer-conditioned natural microdetail** — bark and rock reuse compact source maps in extra frequency bands only where the observer can read them.

Proof 1 established the representation but the live visual delta was too small. Proof 2 therefore changes the vegetation representation itself instead of merely turning a density knob.

## Proof 2 — toroidal observer grass clipmap

Far March now carries two fixed-capacity grass rings centered on the player:

| Ring | Cell | Grid | Shared blades / cell | Max ribbon triangles |
| --- | ---: | ---: | ---: | ---: |
| hero | 0.72 m | 48×48 | 20 | 184,320 |
| near | 1.35 m | 56×56 | 8 | 100,352 |
| **total** | — | **5,440 slots** | — | **284,672** |

The ceiling is two extra instanced draws and 284,672 ribbon triangles. There is deliberately no world-area term in that equation.

### Toroidal update law

Each world cell maps to an instance slot by modular arithmetic:

`slot(gx,gz) = mod(gx,N) + N * mod(gz,N)`

When the observer crosses one hero cell, only the newly exposed column is rewritten: **48 matrices instead of 2,304**. A one-cell diagonal shift rewrites `2N-1 = 95` slots. Old interior cells remain untouched and an entering world cell overwrites the exact slot vacated on the opposite edge.

The candidate at `(gx,gz)` is reconstructed from integer world hashing, ecology, terrain height and road exclusion. It therefore does not swim with the camera. Leave a patch and return later: the same world cell reconstructs the same jitter, yaw, acceptance rank and scale.

### Low-discrepancy tuft geometry

The shared blade geometry inside each cell uses R2-style irrational increments rather than independent random point placement. This reduces local clumping for a fixed blade count. Per-cell deterministic rotation and scale then break visible repetition between otherwise shared tufts.

### Visual aggression without payload aggression

- no new texture files
- no additional world/save entities
- no grass allocation proportional to map size
- original sparse vegetation remains as far context; the clipmap supplies the dense readable observation bubble
- ground gets a stronger near-field high-frequency color/normal band from textures already resident in memory
- bark/rock get two decorrelated high-frequency resamples only inside the readable distance band
- oak/rock anisotropy and normal response are strengthened after load

## Court / kill criteria

The implementation is retained only if live play shows a major density/readability improvement without unacceptable FPS loss.

The next stage is not allowed to increase static world grass. It must either:

1. move observer-field culling/compaction to a GPU-driven path, or
2. introduce measured perceptual-budget control that reduces detail automatically when its marginal screen-space value falls below cost.

The invariant remains: **doubling Alderwatch's physical world size must not materially increase steady-state detail-field cost.**
