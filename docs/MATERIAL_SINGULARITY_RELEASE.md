# Frontier Graphics Proof 10 — Material Singularity

## Mission

Return to the original graphics program: make Alderwatch appear to contain far more surface information than its resident texture bytes and steady-state browser cost should permit.

This release attacks the material representation directly. It is not another grass-density or sky-tuning pass.

## Representation

Important solid materials now resolve three frequency bands from compact source data:

`macro history -> meso structure -> micro grain`

The shader estimates the world-space footprint represented by one screen pixel using derivatives. Fine bands are admitted only while they can materially change the image. As projected footprint grows, micro detail disappears first, then meso, then supplemental macro work.

The practical effect is that close timber, plaster and thatch can reuse their already-resident source maps through decorrelated domains, while distant instances return toward their authored base sample before the extra frequency would alias or waste bandwidth. Bark and rock do **not** receive another duplicate stack of texture reads because Proof 4 already owns their screen-space microdetail path; Proof 10 adds mainly low-frequency history to those surfaces.

## Material history

The same compact texture no longer means the same surface everywhere. Deterministic world-space fields introduce restrained, coherent variation:

- bark: base dampness / muted moss-weathering bias
- stone: up-facing lichen tendency and geological macro breakup
- timber: coherent aging and grain contrast
- plaster: low-wall dirt plus rain-streak structure
- thatch: warm/cool macro variation and close strand-frequency modulation

This is intentionally low-frequency and bounded. It should read as material history, not procedural TV static.

## Ground

The Far March floor receives a stronger multiscale ecological decomposition without new texture objects:

- smooth value-noise macro fields replace the more visibly periodic sine breakup
- a second meso field controls stochastic mixing of the two existing texture domains
- moisture-like broad variation shifts meadow hue coherently rather than uniformly
- the explicit-grass -> statistical-biomass handoff is strengthened so the distant ground carries more of the lush vegetation mass instead of returning to yellow carpet

The existing roughness/normal maps and perceptual-market quality gate remain intact.

## Cost contract

New solid-surface runtime:

- **0 new texture uniforms**
- **0 new texture files required for the visual change**
- timber/plaster/thatch: maximum 2 supplemental reads while close enough to resolve them
- bark/stone: 0 supplemental reads from this release; their prior bandwidth-limited detail remains the owner
- all extra texture reads collapse to zero as projected footprint grows
- all procedural identity is deterministic in world space

## GPU-native texture lane

Proof 10 also activates the production substrate for KTX2/Basis without pretending that a container alone is a win.

- the build copies `basis_transcoder.js` and `basis_transcoder.wasm` from the **exact installed Three.js package**, avoiding CDN/version drift
- `createAlderwatchKTX2Loader(renderer)` is now the canonical loader factory and calls `detectSupport(renderer)` as required by Three
- the planning model freezes ETC1S for color-dominant maps and UASTC for normal/roughness/mask data
- residency accounting is based on full mip-chain bits-per-pixel rather than WebP file size

The first binary payload migration remains a measured follow-up: color, normal and roughness KTX2 outputs must be generated from the masters, visually compared, and accepted only if actual browser GPU residency/frame pacing beat the current WebP path. This release does not fake that result by checking in unmeasured binaries.

## Reality gate

CI can prove the deterministic/budget contracts. It cannot prove beauty.

This survives only if live play shows a material-scale jump:

- tree trunks and rocks stop reading as one repeated bitmap pasted over geometry
- timber/plaster/thatch acquire close-range structure and broad age variation
- ground repetition weakens noticeably
- the lush vegetation field hands off into a greener, more continuous distant surface
- no obvious shimmer or procedural-noise aesthetic appears
- frame pacing remains acceptable

If the browser image does not materially improve, increase or replace the representation; do not defend a weak result because the math is elegant.
