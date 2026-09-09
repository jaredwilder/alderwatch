# Alderwatch Frontier Graphics Master Plan

Status: active research program

Goal: make Alderwatch look materially richer than a normal browser game while keeping steady-state cost bounded by what the player can actually perceive.

This is **not a grass project**. Grass is only the first proving ground because it exposes the core problem brutally: a world can contain enormous apparent detail without the renderer paying for all of that detail at once.

The graphics program is the visual analogue of the large-scale simulation program:

> **Do not store, simulate, shade, or draw the world at the resolution at which the player perceives it. Maintain compact latent state and materialize detail only where observation justifies it.**

---

## 1. North-star invariants

1. **World-size invariance**
   - Doubling Alderwatch's physical world size must not materially increase steady-state graphics cost.
   - The renderer should scale primarily with the observation bubble, screen resolution, and visible complexity.

2. **Perceptual-value allocation**
   - A millisecond of GPU time should go where it creates the largest visible improvement.
   - Distance alone is not a sufficient LOD metric.
   - Projected area, silhouette importance, contrast, motion, center-screen weighting, gameplay relevance, and material bandwidth all matter.

3. **Continuous representation ladder**
   - Detail should not abruptly pop between representations.
   - Preferred ladder:

     `explicit geometry -> cheap geometry -> statistical surface representation -> atmosphere/horizon representation`

4. **Deterministic reconstruction**
   - Latent world detail must reconstruct from world coordinates and stable seeds.
   - Camera motion must not make vegetation, stones, material breakup, or other procedural detail visibly swim.

5. **Compact-source amplification**
   - Source assets should carry much more apparent information than their resident bytes imply.
   - Prefer stochastic synthesis, multiscale domains, procedural weathering, compressed GPU-native formats, and view-conditioned detail over giant unique bitmaps.

6. **Browser-first, not browser-timid**
   - WebGL remains a valid production path where it wins.
   - WebGPU is an experimental acceleration path, not a mandatory rewrite.
   - Every frontier idea must survive real browser frame-time, memory, bandwidth, compatibility, and visual judgment.

7. **External reality outranks the Court**
   - Tests can prove budgets, determinism, monotonicity, and update laws.
   - They cannot prove beauty.
   - Live screenshots and FPS decide whether a graphics hypothesis survives.

---

## 2. Current proof chain

### Proof 1 — compact detail synthesis

Established the mathematical direction:

- deterministic nested vegetation sampling
- aperiodic multiscale ground synthesis
- observer-conditioned bark and stone microdetail
- no world-size term in the intended architecture

Result: technically useful, visually too timid.

### Proof 2 — toroidal observer vegetation

Changed the representation instead of another density knob:

- fixed-capacity camera-centered grass fields
- stable world-space hashing
- O(N) row/column recycling instead of O(N^2) rebuilds
- low-discrepancy shared tuft geometry
- dense local biomass with fixed draw/instance budget

Result: first major visual win. The near field became obviously lush.

### Proof 3 — multiband vegetation + statistical horizon bridge

Attacks the visible "lush circle / savannah outside" failure:

- hero / near / mid / far observer bands
- overlapping stochastic crossfades
- far blade coverage beyond 100 m
- fading completes before square clipmap edges
- explicit blades transition into statistical ground biomass

This is the correct long-term direction: **geometry must surrender to cheaper representations before the eye can see the handoff.**

### Proof 4 — screen-space material bandwidth

Current/in-flight material experiment:

- bark and rock detail is admitted according to projected UV footprint
- high-frequency octaves die as they become sub-pixel
- multiple decorrelated texture domains reuse compact resident maps
- existing normal and roughness data provide extra readable microstructure
- no new texture files, uniforms, or draw calls

This moves material LOD from "distance" toward a Nyquist-style screen-space rule.

---

# 3. The full program

## Workstream A — Observer-conditioned vegetation world

Grass is only phase one. The field architecture expands to the entire low vegetation layer.

### A1. Grass representation ladder

Target:

- 0–15 m: dense individual blades / hero tufts
- 15–40 m: cheaper tuft silhouettes
- 40–100+ m: sparse coarse silhouettes
- beyond useful blade scale: statistical biomass encoded in terrain shading

Requirements:

- no hard circle
- no square clipmap seam
- no visible population popping
- no camera-relative swimming
- fixed or adaptively bounded resident capacity

### A2. Species field

Replace generic green carpet with a deterministic ecology-conditioned mixture:

- short grass
- tall grass
- sedge
- clover / low broadleaf
- dead stalks
- woodland herbs
- fernlets
- dry meadow seed heads

The field should derive species probabilities from ecology state such as moisture, shade, forest edge, soil/wear, and disturbance rather than random visual scatter.

### A3. Density as a continuous field

Vegetation density should become a continuous scalar field rather than a binary candidate accept/reject aesthetic.

Potential basis:

`density(x,z) = ecology * moisture * light * disturbance * terrain suitability * local stochastic residual`

The renderer samples this field at the representation appropriate to screen-space scale.

### A4. Interaction field

Near vegetation can respond locally without simulating every blade:

- player compression
- short-lived wake / bend field
- animal passage
- wind impulses
- combat disturbance

Store interaction as a coarse transient field or sparse impulses. Let the grass shader reconstruct the local response.

### A5. Temporal anti-pop

Investigate stable temporal transitions:

- hashed stochastic population crossfade
- blue-noise / low-discrepancy population ranks
- hysteresis around LOD thresholds
- temporal accumulation only if browser cost justifies it

No obvious "loading circle" is acceptable.

---

## Workstream B — Infinite-looking compact materials

Objective: make 1K–2K source material behave perceptually like much richer unique surfaces.

### B1. Screen-space bandwidth gate

For each material octave, estimate projected footprint with derivatives and admit only resolvable frequencies.

Desired rule:

`pixel footprint -> allowed spatial bandwidth`

This applies to:

- bark
- rock
- soil
- plaster
- timber
- roof thatch
- leather
- roads
- mud

### B2. Stochastic anti-tiling

Research and implement stronger variants of stochastic texture synthesis for natural materials:

- decorrelated transformed domains
- stochastic texture tiling
- histogram-preserving blending where practical
- texture bombing / patch synthesis where it outperforms simple resampling
- world-space macro variation layered over UV-space microstructure

Kill condition: if a supposedly "better" technique adds ALU/samples but a side-by-side image does not clearly suppress repetition or improve material richness, remove it.

### B3. Macro / meso / micro decomposition

Every important natural material should have separate scales:

- **macro**: meters — age, dampness, orientation, exposure, moss bands, geological staining
- **meso**: centimeters — bark plates, cracks, stone grains, wood growth patterns
- **micro**: millimeters — roughness, pores, fine normals

Do not ask one texture frequency to carry all three scales.

### B4. Procedural weathering

Use world orientation and environmental fields to generate believable material history:

- moss on shaded/wet surfaces
- bleaching on exposed faces
- dirt accumulation low on walls
- darker bark near roots
- rain streaking
- edge wear
- lichen on rocks

Weathering must be restrained and low-frequency enough to avoid procedural-noise aesthetics.

### B5. Parallax / relief only where justified

Investigate parallax occlusion or cheaper relief approximation on close hero surfaces.

Never globally enable it.

Use projected area / grazing angle / material importance to decide whether relief work can change visible pixels.

---

## Workstream C — GPU-native texture pipeline

WebP reduces transport bytes but is not the end-state for GPU residency.

### C1. KTX2 / Basis pipeline

Move suitable 3D material assets toward KTX2:

- ETC1S where compactness dominates
- UASTC where quality matters, especially normal maps
- correct mip chains
- anisotropy where useful
- measurement of decoded GPU residency, not just file size

### C2. Progressive mip residency

Long-term target:

- low mips available first
- higher mips streamed or admitted only for nearby/high-value assets
- avoid paying full high-resolution residency for materials currently occupying tiny screen regions

### C3. Texture packing

Audit channel packing opportunities:

- roughness / AO / masks
- material-specific packed maps
- avoid duplicate texture objects
- reduce sampler count where it helps without destroying material quality

### C4. Asset quality ladder

Use higher-resolution masters selectively.

The doctrine is not "never use 4K". It is:

> Use high-resolution source information only when compression, residency, and screen-space demand make it profitable.

---

## Workstream D — Trees as multiscale organisms

Current trees are among the most visually dominant objects in the game. They need a dedicated system.

### D1. Trunk/bark fidelity

- screen-space material bandwidth
- stronger authored normal/roughness data where needed
- stochastic anti-repeat
- root-zone darkening / moss
- unique low-frequency variation per tree

### D2. Geometric individuality from basis deformation

Avoid storing dozens of tree meshes merely for variation.

Explore compact deformation parameters:

- trunk taper
- trunk lean
- branch droop
- crown width
- crown asymmetry
- root flare

A small basis vector can make one authored oak generate many believable individuals while preserving batching opportunities.

### D3. Leaf/canopy representation ladder

Near:

- readable leaf clusters / branch silhouettes

Mid:

- cheaper cluster cards / simplified canopy geometry

Far:

- impostor or analytical canopy density

Transition based on projected crown size and silhouette error, not raw distance alone.

### D4. Tree impostor research

Evaluate:

- octahedral impostors
- multi-view impostor atlases
- depth-aware impostors
- baked lighting vs relit impostors
- runtime generation for authored trees

Goal: make far forests dense without thousands of expensive full crowns.

### D5. Forest composition

Better rendering cannot rescue bad placement.

Use ecology fields to create:

- canopy clumps
- gaps
- edge thickening
- sapling zones
- deadwood
- understory gradients

The far forest should read as a coherent ecosystem, not evenly spaced tree objects.

---

## Workstream E — Rocks and ground-contact realism

### E1. Rock material fidelity

- stochastic geological material
- triplanar/world-space fallback where UVs fail
- close relief only on high-value rocks
- lichen / wetness / soil staining

### E2. Shape variation

Use deterministic low-amplitude deformation or a compact authored basis to increase silhouette diversity without asset explosion.

### E3. Ground contact

Every large object should visually sit in the world:

- grass exclusion / compression at bases
- root and rock occlusion darkening
- soil/litter accumulation
- shallow decal or field-based blending where justified

Floating/sticker-like props destroy perceived fidelity faster than missing texture resolution.

---

## Workstream F — Terrain as a multiscale ecological surface

### F1. Replace "yellow carpet" at every scale

Terrain needs distinct statistical identities for:

- meadow
- forest floor
- road
- mud/wet soil
- trampled settlement ground
- rocky zones
- water margins

### F2. Material field rather than texture switch

Use continuous weights driven by ecology and gameplay disturbance.

Example latent state:

`surface(x,z) = {grass biomass, litter, soil exposure, moisture, rockiness, wear}`

The shader reconstructs visible surface composition from these weights.

### F3. Macro color breakup

Suppress giant uniform color fields with coherent low-frequency ecological variation, not noisy procedural speckle.

### F4. Horizon continuity

The ground's distant statistical representation must visually agree with the vegetation field so geometry can disappear without revealing a color/material discontinuity.

---

## Workstream G — Lighting, shadows, and atmospheric depth

High-detail geometry with prototype lighting still looks cheap.

### G1. Shadow value allocation

Current shadow maps are expensive. Investigate allocating shadow quality by perceptual impact:

- player/enemies
- nearby tree trunks
- major structures
- foliage contact shadows

Do not spend equal shadow fidelity everywhere.

### G2. Contact grounding

Explore cheap screen-space or field-based grounding for:

- grass bases
- rocks
- trunks
- structures

### G3. Foliage transmission

Leaves and grass need convincing daylight response without expensive subsurface simulation.

Evaluate inexpensive wrap/transmission approximations and backlighting.

### G4. Atmosphere as LOD camouflage

Fog/haze should be physically/aesthetically useful, not a hack to hide draw distance.

Use atmospheric depth to make far representation changes less visible while preserving the current bright readable daylight direction.

---

## Workstream H — Geometry and draw-call economy

### H1. GPU-friendly batching contract

Preserve/materially improve:

- instancing
- geometry compatibility
- material grouping
- texture atlasing only where useful

Avoid visual fixes that explode draw calls.

### H2. Mesh simplification pipeline

Use controlled LOD meshes for authored assets based on projected geometric error.

Potential tools/ideas:

- meshoptimizer simplification
- screen-space error targets
- cluster-based simplification

### H3. Meshlet / cluster research

Experimental path for WebGPU:

- cluster geometry into small independently cullable units
- GPU frustum / occlusion / error testing
- compact visible clusters into indirect draws

Only pursue if measured CPU/draw overhead justifies the complexity.

---

## Workstream I — Perceptual-budget renderer

This is the central long-term research target.

Each possible fidelity upgrade has a visual value and a cost.

For patch/object/material i at level l:

`R(i,l) = DeltaVisualValue / DeltaCost`

Visual value may include:

- projected pixel area
- contrast
- silhouette importance
- center-screen / gaze proxy
- motion
- gameplay relevance
- temporal instability risk
- material frequency visibility

Cost may include:

- triangles
- fragment shading
- texture bandwidth
- shadow work
- CPU update work
- draw-call overhead

Runtime goal:

> Within a fixed frame budget, spend the next unit of work on the fidelity upgrade with the highest marginal visible return.

We do not need to solve a giant exact knapsack every frame. Practical implementation can use:

- quantized tiers
- cached marginal values
- hysteresis
- rolling frame-time controller
- hard minimums for gameplay readability

### I1. Frame-time controller

Measure rolling GPU/CPU frame cost and maintain a target.

If over budget:

- shed least valuable microdetail first
- reduce far vegetation population
- reduce shadow quality/range
- lower expensive surface octaves

If under budget:

- restore the highest-value missing detail first

### I2. Stable degradation

Adaptive quality must not visibly pump every second.

Use hysteresis, slow recovery, and tier dwell times.

### I3. Device calibration

At startup or first load, infer a conservative device class from measured work rather than user-agent guessing alone.

---

## Workstream J — WebGPU research lane

Do **not** rewrite Alderwatch merely because WebGPU exists.

Build sealed experiments proving individual wins.

### J1. GPU vegetation candidate generation

Candidate vegetation exists implicitly in world space.

GPU compute performs:

`latent candidate -> ecology gate -> frustum/error gate -> LOD tier -> compact survivor`

CPU should not own millions of blades or candidates.

### J2. Indirect draws

Use compute-generated visible counts / indirect arguments where browser support and Three.js path are mature enough.

### J3. GPU cluster culling

Test trees/rocks/props as small geometry clusters.

### J4. TSL-first experimental shaders

New WebGPU experiments should use Three.js's current node/TSL direction rather than relying on WebGL-only `onBeforeCompile` architecture.

### J5. Fallback contract

Production cannot depend on WebGPU until compatibility and stability are good enough. Preserve a strong WebGL2 path.

---

# 4. Perceptual benchmark court

Graphics research needs more than unit tests.

Create a fixed set of representative camera scenes:

1. **Meadow hero** — boots in dense grass, long open sightline
2. **Forest interior** — bark, roots, shade, litter, undergrowth
3. **Forest edge** — transition from meadow to canopy
4. **Rock field** — close and distant geological surfaces
5. **Settlement** — buildings, roads, clutter, vegetation contact
6. **Long horizon** — worst case for savannah seams / LOD handoff
7. **Motion run** — sprint through vegetation to expose popping/shimmer

For every major graphics PR record where practical:

- screenshot(s) from fixed camera positions
- median FPS / frame time
- 1% low or worst-frame proxy
- draw calls
- triangle count
- texture memory estimate where possible
- JS heap delta where relevant
- network payload delta

A result is not a win if it merely looks better while silently multiplying cost beyond the frozen budget.

---

# 5. Release-sized development sequence

Do not inch through this program. Each round should produce a visibly meaningful release or kill a major hypothesis.

## Release A — Vegetation horizon closure

Finish the current grass proof:

- eliminate visible observer radius
- eliminate yellow/savannah horizon discontinuity
- prove multiband + statistical biomass handoff in motion
- preserve fixed world-size-independent cost

**Exit condition:** user cannot easily point at where explicit grass ends.

## Release B — Material singularity

Attack bark + rocks + ground together:

- screen-space bandwidth
- stochastic anti-tiling
- macro weathering
- normal/roughness microstructure
- benchmark against current compact assets

**Exit condition:** close tree/rock screenshots look materially higher-resolution without giant texture residency.

## Release C — Tree singularity

- trunk individuality basis
- canopy LOD ladder
- far impostors
- forest composition field

**Exit condition:** repeated oak assets stop reading as clones and far forest density rises without proportional draw/triangle growth.

## Release D — GPU-native texture pipeline

- KTX2/Basis conversion experiment
- compare network bytes, GPU residency, load time, and image quality
- progressive mip strategy where viable

**Exit condition:** texture quality can rise while total residency/bandwidth stays within or below the previous baseline.

## Release E — Perceptual governor

- runtime frame-time telemetry
- value/cost fidelity tiers
- stable adaptive degradation/restoration

**Exit condition:** the game self-tunes to a target frame budget while spending quality where the player notices it most.

## Release F — WebGPU compute proof

- sealed vegetation candidate/compaction experiment
- indirect drawing
- side-by-side CPU/WebGL comparison

**Exit condition:** real measured gain large enough to justify production integration. Otherwise retain WebGL architecture and keep the research result isolated.

---

# 6. Things we explicitly refuse to do

- blindly raise global grass/object counts
- solve close-detail problems by shipping gigantic uncompressed textures
- hide every LOD transition with heavy fog
- migrate the whole renderer to WebGPU without isolated proof
- add expensive shaders whose visual delta is not obvious
- accept a beautiful screenshot that causes unacceptable motion/frame-time behavior
- accept a fast renderer that looks like a prototype
- let far terrain and near vegetation use visually incompatible statistical models
- let adaptive quality visibly oscillate
- confuse "procedural" with "random noise everywhere"

---

# 7. Research questions worth serious attack

1. Can a deterministic multiresolution ecology field drive **simulation, vegetation geometry, material composition, and weathering** from the same latent state?
2. Can we derive a practical browser-side perceptual error metric that outperforms distance-only LOD enough to matter visibly?
3. Can stochastic material synthesis make a compact 1K/2K material read like a much larger unique surface at normal play distances?
4. Can far vegetation become a statistical shading problem early enough that explicit geometry cost remains almost constant as world scale grows?
5. Can tree individuality be represented by a tiny deformation vector rather than dozens of unique meshes?
6. Can KTX2 + progressive mip admission let us raise source fidelity while reducing total GPU residency?
7. Can a WebGPU compute path treat vegetation as latent candidates and materialize only visible survivors cheaply enough to beat the current CPU/instancing path?
8. Can one unified marginal-value controller allocate grass, texture bands, shadow quality, impostor fidelity, and geometry LOD under a single frame-time budget?
9. Can temporal stability itself be treated as a perceptual cost so the renderer prefers a slightly lower but stable representation over a higher-detail shimmering one?
10. Can the entire world renderer adopt the same principle as the million-NPC system: **exact state only where observation requires exactness**?

---

# 8. End-state vision

Alderwatch should be able to show:

- boots buried in dense moving grass
- convincing meadow-to-forest ecology
- bark with centimeter and millimeter structure
- rocks with geological richness and weathering
- thick forests without obvious clone repetition
- roads and settlement ground that read as physically used places
- distant landscape that remains lush rather than collapsing into a flat yellow carpet
- smooth, nearly invisible transitions between explicit and statistical detail
- stable browser performance even as the physical world expands dramatically

The accomplishment is not "a browser game with lots of grass."

The target is a renderer where **apparent world detail scales much faster than resident computational cost**, because Alderwatch treats visual reality as a hierarchy of latent fields that become exact only when the player can actually see the difference.
