# Forest Singularity — Proof 5

This release moves the frontier graphics program beyond grass and texture sharpening into **observer-conditioned natural objects**.

The governing idea is unchanged:

> a tree, rock, or forest should contain more apparent information than the browser explicitly stores or renders at full fidelity.

## 1. Trees become organisms, not cloned props

Every oak receives a deterministic phenotype derived from world position plus ecology:

- age
- height
- crown width on two axes
- exposure-driven lean
- yaw residual
- root flare
- canopy colour identity

The phenotype is a compact basis, not another mesh. Detailed oaks and distant instanced oaks use the same field, so unloading/reloading a region reconstructs the same tree identity.

The intended visual effect is subtle but cumulative: forests stop reading as repeated identical meshes even when they still share authored geometry.

## 2. Canopy depth without a new texture payload

The existing leaf material now receives a cheap observer-readable canopy layer:

- per-tree colour identity from stable world anchoring
- low-frequency crown fleck variation
- restrained back-face transmission approximation
- screen-space derivative gate so the extra canopy response fades once leaf texture frequency is no longer readable

No new leaf texture, sampler, or draw is introduced.

## 3. Ground contact becomes an observer field

Trees and rocks now share one fixed-capacity contact layer rather than receiving independent decals.

Budget:

- 96 active contact instances
- 20 triangles in the shared irregular patch
- 1,920 rendered-triangle ceiling
- 1 draw call

Only the nearest standing trees/rocks within the observer region are materialized. The patch is aligned to terrain slope, given deterministic orientation/shape, and coloured toward moss/soil for trees or embedded earth for rocks.

This is the same representation doctrine as the vegetation clipmap: **contact exists statistically everywhere but geometrically only where the observer can resolve it.**

## 4. Rocks receive deterministic silhouette deformation

Rock instances now receive bounded anisotropic deformation and tilt from world coordinates. The deformation is deliberately low amplitude so collisions remain authoritative while repeated authored-rock silhouettes become much harder to spot.

No new rock meshes are stored.

## 5. Perceptual Governor v1

This is the first live adaptive-budget controller in the graphics program.

It measures a smoothed frame interval and maintains a stable quality scalar with asymmetric hysteresis:

- overload sheds detail quickly
- headroom restores detail slowly
- hero grass is never degraded by the governor
- near detail is protected
- mid detail is reduced next
- far population absorbs the largest cut

The four grass rings expose a uniform quality gate. Because population rank is already a deterministic world-space hash, changing quality removes the least important far candidates without causing camera-relative swimming or reallocating the torus.

This is intentionally only the first budget channel. The long-term governor will allocate across materials, shadows, vegetation, geometry, and atmosphere by marginal visible return per unit cost.

## Court

The release freezes:

- deterministic tree identity
- phenotype bounds
- >80 distinct sampled tree phenotypes across the Court grid
- bounded rock deformation
- fixed contact budget of 96 instances / 1,920 triangles / 1 draw
- hero > near > mid > far quality priority under stress
- fast degradation / slow recovery hysteresis
- bootstrap ordering after existing bark/material research and before world construction
- shader-level grass quality gate

## Live kill checks

The Court cannot prove this looks better. Live play decides:

1. Do adjacent oaks look materially less cloned?
2. Do leaf masses read with more depth in bright daylight?
3. Do trunks and rocks feel planted rather than stickered onto the terrain?
4. Does the forest retain density without visible adaptive pumping under load?
5. Is the FPS impact acceptable?

If individuality is too weak, increase phenotype basis expressiveness rather than spawning more meshes. If contact patches read as decals, replace them with a better field representation rather than hiding the failure. If the governor pumps visibly, increase hysteresis before expanding it to additional systems.

## Next release candidates

- ecology-driven understory species field: grass / sedge / broadleaf / dead stalk / fernlet populations from one continuous latent field
- projected-error tree canopy ladder and depth-aware impostor experiment
- KTX2/Basis GPU-resident material pipeline
- cross-system perceptual allocator using measured marginal visual value / cost
