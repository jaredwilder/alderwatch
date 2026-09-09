# Horizon Singularity — Frontier Graphics Proof 7

This release attacks the two remaining large-scale visual seams in the Far March: the beautiful explicit grass field ending too soon, and forests collapsing into sparse repeated trunks at distance.

The governing rule is unchanged: **apparent detail may grow with view importance, but steady-state cost must remain bounded by the observer representation rather than total world area.**

## 1. Grass beyond the old circle

The existing four grass bands ended around 138 m. Proof 7 adds two much cheaper scales:

- `horizon`: 96² cells at 4.75 m, one crossed tuft per cell, eligible to 222 m
- `vista`: 112² cells at 7.20 m, one crossed tuft per cell, eligible to 382 m

The whole six-band grass system has a fixed ceiling of 40,128 instance slots, 676,096 ribbon triangles, and six draw calls. There is still no term proportional to physical world area.

The new far bands use geometrically increasing sample spacing: projected density falls as perspective makes individual blades less resolvable. They carry only the silhouette frequency needed by the image.

## 2. Superellipse observer metric

A Euclidean circular fade wastes the corners of the square toroidal allocation. Proof 7 progressively replaces that metric with an Lp norm:

`d_p = (|dx|^p + |dz|^p)^(1/p)`

Near the player `p=2`, preserving circular hero behavior. Farther out `p` rises to 4. The visible support becomes a soft superellipse, reclaiming much of the already allocated square domain without increasing instance capacity. Fade-out still completes before the torus edge.

Stable low-discrepancy population rank replaces the previous sine hash in the fade decision so thinning remains spatially even and deterministic.

## 3. Canopy representation by angular error

Raw distance is not the correct LOD variable for trees. A large nearby crown and a small distant crown matter according to their projected angular diameter:

`theta = 2 atan(size / (2 distance))`

The frozen reference thresholds for a 7.2 m canopy are approximately:

- full authored tree above 0.052 rad (~138 m boundary)
- compact crown proxy above 0.022 rad (~327 m boundary)
- statistical forest-mass proxy above 0.0125 rad (~576 m boundary)
- no individual canopy representation beyond that

This is an error criterion: if a representation cannot materially change enough screen space, it is replaced by a cheaper basis.

## 4. Two fixed-capacity horizon forest fields

`crown` carries recognizable tree silhouette using 32 triangles per candidate. `mass` carries only trunk frequency and broad crown volume using 12 triangles per candidate.

Combined ceiling:

- 9,280 slots
- 215,040 triangles
- 2 draw calls
- zero new texture files

Both fields are deterministic toroidal reconstructions, reuse tree phenotype and the shared ecology field, and recycle only newly exposed rows/columns as the observer moves.

## 5. Perceptual governor integration

The new grass horizon/vista populations and forest-mass proxies are first-class budget channels. Under sustained frame pressure, the cheapest/farthest information is removed first while hero grass and nearby structure remain protected. Deterministic ranks are retained, so quality changes thin the same latent population instead of rerolling the scene.

## Court

The frozen checks cover:

- exact six-band grass budget: 40,128 slots / 676,096 triangles / 6 draws
- vista field physically covers >400 m per axis and fades near 382 m
- combined grass coverage does not collapse before 350 m
- L4 metric materially reclaims torus-corner support versus Euclidean distance
- O(N) toroidal row/column updates at every grass scale
- exact angular-diameter inversion and representation boundaries
- exact horizon forest budget: 9,280 slots / 215,040 triangles / 2 draws
- O(N) canopy-field recycling
- no new texture loading path
- bootstrap ordering before world construction

## Acceptance

Tests are not the visual judge. The release survives only if live play shows materially farther explicit grass with no obvious circular cutoff, and distant woodland reads as continuous forest structure rather than sparse repeated individual trees. FPS must remain stable enough that the perceptual governor is not visibly pumping quality.
