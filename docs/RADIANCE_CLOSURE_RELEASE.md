# Frontier Graphics Proof 9 — Radiance Closure

## Problem

Alderwatch's geometry/detail frontier improved faster than its global light transport. The outdoor image was still internally inconsistent:

- the player saw an Alderwatch daylight panorama,
- PBR materials were illuminated/reflected by `RoomEnvironment`, an unrelated studio-room probe,
- a strong HemisphereLight then filled the mismatch back in,
- exponential fog converged toward hand-picked colors that did not necessarily match the visible horizon,
- the bright lobe painted into the panorama was not mathematically tied to the directional light that casts shadows,
- several streamed outdoor realms still used a flat background color.

That combination is cheap, but it makes good assets read flatter and more synthetic than they should. Beauty is not only texture resolution. A coherent radiance field is one of the strongest global multipliers available to every material at once.

## Proof 9

Use **one sky as one radiance authority**.

At the first real outdoor render only, the bootstrap-installed runtime identifies the actual game scene, restores Three's unmodified render method immediately, and closes the outdoor lighting asynchronously:

1. reuse the already-authored `alderwatch-sky.webp` equirectangular panorama, or load that same 69 KB asset in an outdoor realm that still had a flat background;
2. downsample the panorama once to a 96×48 CPU canvas and robustly estimate both the broad horizon color and any genuinely localized bright sky lobe;
3. use a circular weighted mean for the bright lobe so a sun crossing the equirectangular seam is still treated as one direction;
4. if that lobe is sufficiently concentrated and brighter than the sky median, rotate only the panorama/environment **azimuth** until the visible sun direction agrees with the existing directional-light shadow direction; broad cloud decks fail this confidence gate and are left alone;
5. generate one GGX-compatible PMREM from that panorama;
6. assign the PMREM to `scene.environment`, so rough PBR surfaces receive prefiltered sky radiance rather than the unrelated room probe;
7. keep the existing HemisphereLight only as a reduced fail-soft floor instead of the dominant ambient wash;
8. trim bright sun/cloud cores and black silhouettes from the horizon estimator, then pull FogExp2 color toward the measured broad horizon and reduce extinction modestly;
9. keep the existing directional sun and shadow system intact.

Three's PMREM path prefilters an equirectangular environment for the GGX BRDF used by physical materials. The underlying real-time-lighting principle is old and strong: distant illumination can be aggressively prefiltered because rough/diffuse response is low-frequency. Proof 9 spends that precomputation once rather than adding a full-screen effect every frame.

The sun alignment is deliberately one-dimensional. We do not pitch or roll the panorama, because doing so would tilt the horizon. We solve only the periodic yaw discrepancy between the panorama's localized radiance lobe and the existing world-space sun vector. If the image does not contain a trustworthy localized lobe, alignment is skipped rather than hallucinated.

## Performance contract

Steady state adds:

- **0 draw calls**
- **0 full-screen post passes**
- **0 new asset files**
- **0 recurring CPU image analysis**
- **0 render-wrapper overhead after capture**

There is a one-time PMREM generation cost when the outdoor scene closes and one tiny 96×48 CPU readback of the already-loaded panorama. The resulting environment texture stays resident for the scene lifetime. The previous RoomEnvironment texture is disposed after successful replacement.

## Fail-soft contract

If the sky cannot load, canvas sampling is unavailable, the bright-lobe confidence test fails, or PMREM generation fails, the relevant optional step is skipped or the existing scene remains intact. The old room environment / fog / lighting are not destroyed until the replacement exists. Deep Iron is excluded by construction because outdoor closure requires the scene's shadow-casting directional sun.

## Court

The Court freezes these claims:

- environment radiance increases into a bounded range while ambient HemisphereLight decreases;
- fog thinning is modest and bounded rather than deleting atmosphere;
- horizon estimation is robust to tiny white sun cores and black silhouettes;
- a compact synthetic sun lobe is recovered at the correct azimuth;
- the sun estimator remains circular across the equirectangular seam;
- background and environment receive the same yaw correction, so reflections cannot rotate away from the visible sky;
- only scenes with a shadow-casting DirectionalLight are eligible for outdoor closure;
- the runtime is installed before realm selection, so Far March and streamed outdoor realms share the same closure mechanism;
- implementation must use equirectangular PMREM;
- implementation must restore the stock Three render hot path after scene capture;
- no EffectComposer / SSAO / GTAO / SMAA post stack may be smuggled into this proof;
- the only sky path is the already-shipping Alderwatch panorama.

## Acceptance

Unit tests and build are necessary, not sufficient. In live first-person play this release survives only if:

- wood, bark, rock, metal and foliage feel lit by the world they visibly inhabit;
- shaded faces retain readable cool sky fill without the old uniform ambient wash;
- the painted sun/cloud highlight and hard shadow direction no longer advertise two different suns;
- fog/horizon transitions stop feeling like a separate flat color layer;
- streamed outdoor realms gain a real sky instead of a solid-color ceiling;
- frame pacing after scene entry is unchanged within measurement noise.

If it looks worse, revert the tuning. External visual reality outranks the mathematical elegance of the closure.
