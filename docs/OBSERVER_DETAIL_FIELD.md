# Observer Detail Field — Research Proof 1

Goal: increase *perceived* world detail faster than resident world cost.

This PR proves the first three layers without changing gameplay state, save data, ecology, world size, or draw-call topology:

1. **Nested deterministic vegetation population** — each grass clump is a compact field sample with 88 curved blades instead of 40. The runtime still owns/instances the same clump objects. Four deterministic rank bands are nested so later clipmap/GPU LOD can remove fine bands without relocating surviving blades.
2. **Aperiodic multiscale ground synthesis** — compact field/litter source textures are sampled in decorrelated rotated domains with continuous low-frequency coordinate warping. A second normal octave exists only near the observer and fades from 24–92 m.
3. **Observer-conditioned natural microdetail** — existing bark and rock maps gain a second decorrelated micro-frequency during asset load. The extra contribution fades from 22–105 m, spending the texture sample only where it changes readable pixels.

## Cost contract

- No new terrain meshes.
- No new world entities or save state.
- No increase in grass draw-call count from the density change.
- No new texture files or network payload.
- Grass source geometry grows from 40 to 88 blades per shared cell: 2.2x blade vertex/triangle work for dramatically more local biomass, rather than 2.2x JS objects or draw calls.
- Ground and bark/rock pay additional texture ALU/samples; high-frequency contribution is view-distance attenuated.

## Research trajectory

The pure functions in `detail-field-math.ts` freeze the next architecture: deterministic world hashing, nested samples, screen-space perceptual tiers, and density multipliers. The intended next proof is camera-centered clipmap rings (WebGL first), followed by a WebGPU compute/indirect path when measured gains justify migration.

## Kill criteria for the next round

Do not keep increasing density blindly. The next renderer step must demonstrate that apparent vegetation detail rises while steady-state object/draw-call counts remain approximately bounded by the observation bubble rather than total world area.
