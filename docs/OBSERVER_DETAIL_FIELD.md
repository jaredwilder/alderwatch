# Observer Detail Field — Research Proofs 1–3

Goal: increase *perceived* world detail faster than resident world cost.

## Proof 1 — compact detail synthesis

1. **Nested deterministic vegetation population** — the original shared grass clump grew from 40 to 88 curved blades without multiplying JS grass objects.
2. **Aperiodic multiscale ground synthesis** — field/litter textures are sampled in decorrelated rotated domains with continuous coordinate warping and observer-faded micro-normal detail.
3. **Observer-conditioned natural microdetail** — bark and rock reuse compact source maps in extra frequency bands only where the observer can read them.

Proof 1 established the representation but the live visual delta was too small.

## Proof 2 — toroidal observer grass clipmap

The first moving field proved the key invariant: dense local grass can follow the observer with fixed resident capacity instead of static world-sized allocation. Live play confirmed a major density increase, but it also exposed the next defect clearly: the near field looked lush while the old yellow terrain beyond roughly 40 m still read as a savannah, producing an obvious moving circular boundary.

That live failure becomes the Court input for Proof 3.

## Proof 3 — multiband horizon closure

Far March now uses four fixed-capacity observer bands rather than two:

| Ring | Cell | Grid | Shared blades / cell | Max ribbon triangles | Fade band |
| --- | ---: | ---: | ---: | ---: | --- |
| hero | 0.72 m | 48×48 | 20 | 184,320 | 11–16.5 m out |
| near | 1.35 m | 56×56 | 8 | 100,352 | 10–16 m in, 28–36.5 m out |
| mid | 2.10 m | 72×72 | 6 | 124,416 | 27–36 m in, 61–74 m out |
| far | 3.20 m | 88×88 | 3 | 92,928 | 59–72 m in, 118–138 m out |
| **total** | — | **18,368 slots** | — | **502,016** | **4 draws** |

The physical far grid reaches **140.8 m per axis**. Its fade completes before the square clip edge, so the square itself cannot become a visible cutoff.

### Stochastic overlap instead of a moving circle

Every band uses observer distance only to define a visibility probability. A stable hash of the instance's world-space translation then decides whether that tuft survives the fade. The dither key is world-stable, not screen-space, so the transition becomes a gradual thinning/thickening of vegetation instead of a translucent ring or a shimmering screen-door pattern.

Adjacent bands overlap deliberately. Court samples the combined coverage every 0.5 m from the player to 125 m and rejects any coverage trough below the frozen minimum.

### Statistical horizon bridge

Individual grass geometry should not survive forever. Beyond the range where blades are worth their pixels, the ground shader now carries the missing biomass statistically using the **same already-resident field texture**:

- open distant ground is progressively shifted toward a greener canopy distribution;
- roads, litter and worn ground are protected by the existing soil/wear field;
- no extra texture uniform, texture object or network asset is added;
- the bridge strengthens with view distance, exactly where geometric grass is thinning.

This is representation morphing rather than a brute-force draw-distance increase:

`explicit blades -> sparse silhouette bands -> statistical canopy field`

### Toroidal update law remains intact

Each world cell maps to an instance slot by modular arithmetic:

`slot(gx,gz) = mod(gx,N) + N * mod(gz,N)`

Crossing one cell in a ring rewrites only one newly exposed row/column. The far ring therefore updates just 88 matrices after a 3.2 m cell crossing rather than rebuilding 7,744 instances.

The candidate at `(gx,gz)` is reconstructed from integer world hashing, ecology, terrain height, water/road exclusion and build occupancy. It does not swim with the camera.

## Cost contract

- 18,368 fixed grass instance slots
- 502,016 maximum ribbon triangles
- four added grass draws
- no world-area term
- no new texture files
- no new texture uniforms for the horizon bridge
- no save/schema/world entity changes
- coarse rings update less frequently because their cells are physically larger

This is intentionally a larger fixed observation bubble, not a return to static world grass. Doubling physical map size still does not increase its steady-state budget.

## Next research gate

If Proof 3 visually closes the savannah seam, the next graphics round should attack *adaptive cost*, not simply add another ring:

1. measured frame-time / projected-pixel value functions;
2. dynamic allocation between grass, bark, rock, shadow and distant geometry detail;
3. GPU-driven candidate compaction / indirect rendering where WebGPU support justifies it.

The invariant remains: **doubling Alderwatch's physical world size must not materially increase steady-state detail-field cost.**
