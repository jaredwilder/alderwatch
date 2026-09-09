# Ecology Singularity — Proof 6

Status: frontier graphics release candidate

This release advances the Alderwatch graphics program beyond “lush grass” into a single latent ecological field that drives multiple visual representations at once.

## Thesis

A believable landscape should not be authored as independent layers of random grass, random shrubs, random moss and a separately tinted terrain.

Instead, Alderwatch now reconstructs those visible layers from one compact continuous world-space ecology state:

`E(x,z) = { moisture, shade, edge, fertility, disturbance, biomass, understory, litter, moss, dryness }`

The field is deterministic. Camera motion does not change it. World size does not appear in the observer-field capacity equations.

## Partition-of-unity species field

Five visible plant niches are derived from the same state:

- fernlets
- low broadleaf plants
- sedge
- dry seed stalks
- shrubs / sapling-edge mass

Their normalized ecological weights sum to one. Wet shade favors fernlets; dry exposed ground favors dry stalks; forest edges favor shrubs and broadleaf structure.

This matters because “variety” is no longer a bag of independent random decorations. Species composition is correlated with the same environmental causes that tint the ground beneath them.

## Representation ladder

The explicit undergrowth field is five fixed-capacity toroidal layers:

| field | cell | grid | fade-out | triangles / instance |
| --- | ---: | ---: | ---: | ---: |
| fernlet | 1.55 m | 42² | 30 m | 10 |
| broadleaf | 1.85 m | 44² | 38 m | 12 |
| sedge | 2.25 m | 52² | 55 m | 12 |
| dry stalk | 2.80 m | 56² | 74 m | 8 |
| shrub | 3.40 m | 60² | 96 m | 12 |

Hard ceiling:

- 13,140 instance slots
- 141,608 triangles
- 5 draws
- zero dependence on total world area
- zero new texture files

The farther the representation, the cheaper its geometry and the later it becomes visible. Low-poly shrub mass is intentionally a mid/far representation rather than a hero-camera object.

Every field uses deterministic toroidal slot recycling. Moving one cell rewrites O(N) instances, not O(N²).

## Procedural micro-geometry instead of asset explosion

The five plant archetypes are generated from tiny mathematical meshes at runtime. They use shared geometry, instancing, stable world-space colour variation and a restrained wind phase. This is not intended to replace authored hero flora; it supplies ecological structure between the existing hero assets and the statistical terrain representation.

## Terrain is now part of the same ecology

The March terrain receives a coarse ecological attribute sampled at 4 m latent resolution. Terrain interpolation reconstructs that field across the much denser mesh.

That means the ecological source resolution follows ecological spatial bandwidth, not pixel count.

The existing ground material then receives biomass / litter / moss / dryness information from that exact field. No additional texture sample is introduced. Distant ground colour therefore agrees with the explicit undergrowth that disappears into it, attacking the old “lush circle over yellow savannah” failure at the causal source rather than with another draw-distance knob.

## Perceptual Governor integration

The Proof-5 governor now implicitly controls this release too. Ecology fields read the live quality scalar after the forest governor runs.

Under frame pressure the order is deliberate:

`dry stalk -> shrub -> sedge -> broadleaf -> fernlet`

Close, high-value ecological structure survives longest. Population rank remains deterministic, so quality changes thin stable populations instead of rerolling the world.

## Court

The release freezes:

- deterministic bounded ecology state across a large world-space sample
- nontrivial ecological diversity
- species weights summing to one
- niche-response sanity checks
- exact 13,140-slot / 141,608-triangle / 5-draw ceiling
- fade completion inside every torus edge
- O(N) row/column recycling at every scale
- exact procedural archetype triangle counts
- governor degradation order
- bootstrap composition after Forest Singularity
- zero new TextureLoader / loadAsync path in the ecology runtime

## Visual acceptance

The Court cannot prove this release is beautiful.

Live judgment should ask:

1. Does the meadow stop reading as one species of grass?
2. Do forest edges visibly accumulate different low vegetation than open field?
3. Do damp/shaded areas read greener and more moss/litter-rich without obvious procedural noise?
4. Does the middle distance contain ecological structure instead of empty yellow floor between tree trunks?
5. Can the player still move without finding a hard observer ring?
6. Does FPS remain stable, and does the governor reduce decoration without obvious pumping?

If the answer is no, the representation is not frozen merely because its tests pass.

## Next magnitude

The next release target is canopy/horizon singularity:

`full authored crown -> simplified crown clusters -> depth-aware impostor / analytical canopy -> forest-density atmosphere`

The objective is to make distant forests scale with projected silhouette information rather than full-tree geometry count.
