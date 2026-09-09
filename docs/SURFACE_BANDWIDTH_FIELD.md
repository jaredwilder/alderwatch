# Surface Bandwidth Field — Research Proof 4

## Mission

Make compact 1K-ish bark and rock source textures read substantially richer at close range **without** paying that detail cost after the projected pixel grid can no longer represent it.

The governing principle is sampling theory, not distance alone.

For a texture coordinate field `u(x,y)`, the fragment shader estimates the projected footprint with screen-space derivatives:

`f = max(|dFdx(u)|, |dFdy(u)|) * materialScale`

Each supplemental frequency band is admitted only while its projected wavelength remains representable. Higher octaves therefore disappear first as the footprint grows.

## Three decorrelated domains

The bark/stone material reuses the already-resident color map in three transformed domains:

1. coarse microstructure at the base detail scale;
2. a 1.67× rotated domain;
3. a 2.71× golden-angle-like rotated domain.

World-space continuous warp breaks the obvious repeat phase. The domains contribute primarily luminance/detail rather than replacing authored base color, so the source material identity survives.

This is not claimed as a full implementation of histogram-preserving stochastic texturing. It is a lightweight browser-game adaptation of the same broad idea: make repetition harder to recover by decorrelating sample domains while preserving the compact source texture.

## Nyquist-style gate

The three extra bands use monotonically stricter derivative thresholds:

- coarse survives longest;
- micro disappears earlier;
- nano disappears first.

This is preferable to a pure `distance < N` rule because a large close surface and a tiny distant surface can have radically different projected texture footprints at the same nominal distance.

## Extra relief without extra assets

When the micro band is readable:

- one resample of the existing normal map contributes cavity/relief contrast;
- one resample of the existing roughness map adds micro-roughness breakup;
- low-frequency world weathering adds subtle moss/lichen/patina variation.

No new texture files or texture uniforms are introduced.

## Hard sample ceiling

At maximum readable detail the supplement is bounded by:

- 3 color samples
- 1 normal-map relief sample
- 1 roughness sample
- **5 supplemental samples total**

Coherent derivative gates skip fine bands as projected footprint grows.

## Why this is useful for Alderwatch

The browser should spend texture bandwidth where the player can resolve bark fissures and rock grain, not on sub-pixel frequencies 80 meters away. The desired visual behavior is:

`compact source -> richer close material -> filtered middle distance -> authored base material`

rather than:

`huge texture -> huge residency -> same wasted sub-pixel detail everywhere`.

## Court

Pure math tests require:

- all band weights are monotone non-increasing with projected footprint;
- higher-frequency bands never outlive lower-frequency bands;
- distant footprints zero the micro/nano octaves;
- supplemental sample budget remains exactly five.

Live browser judgment remains authoritative. If close bark/stone still do not read materially richer, this representation must climb again rather than hiding behind the Court.
