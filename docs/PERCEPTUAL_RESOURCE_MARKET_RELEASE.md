# Perceptual Resource Market — Frontier Graphics Proof 8

Proof 7 made world-scale detail bounded. Proof 8 changes the question from **"how much quality does each subsystem want?"** to **"which next unit of GPU work changes the image the most?"**

The previous perceptual governor produced one scalar quality value, then grass, ecology and canopy independently mapped that scalar to their own curves. That is stable, but it cannot trade work between systems. A distant grass draw can remain alive while more valuable surface detail is starved simply because the two curves never negotiate.

Proof 8 turns the scalar into a **shared frame wallet** and makes render channels compete for it.

## 1. Concave resource allocation

For channel `i`, let:

- `x_i` be its admitted quality in `[floor_i, 1]`
- `c_i` be frozen relative GPU work
- `s_i` be perceptual salience
- `B` be the current frame wallet produced by the existing hysteretic governor

The allocator solves:

`maximize  Σ s_i log(k + x_i)`

subject to:

`Σ c_i x_i <= B`

`floor_i <= x_i <= 1`

with a small positive knee `k`.

The KKT solution is water filling:

`x_i = clamp(s_i / (lambda c_i) - k, floor_i, 1)`

Only the multiplier `lambda` is unknown. Alderwatch solves it with 44 deterministic bisection iterations over 17 channels. This is fixed tiny work: no world scan, no heap, no optimizer package, no stochastic policy and no learned model.

A channel therefore receives the next unit of budget when its **marginal visible value per unit work** beats the alternatives.

## 2. The market

The first market includes:

- six observer grass representations
- five explicit ecology representations
- angular-error crown and forest-mass representations
- forest ground-contact detail
- terrain material detail
- authored canopy material detail
- minor natural-object shadow casting

Hero grass has a hard floor of 1. It is deliberately sacred. Nearby grass, useful undergrowth, legible crown structure, terrain readability and leaf readability have protected floors. Vista grass, horizon grass, statistical forest mass and minor shadows may reach zero under severe sustained pressure.

## 3. Work is tied to the existing Courts

Geometry channel cost is not an arbitrary tier number. It is derived from the already frozen triangle ceilings plus a non-zero draw-call term:

`work = maxTriangles / 20,000 + 0.75 * drawCalls`

The Court recomputes these values from the shipping grass, ecology, canopy and contact-field specifications. If a geometry budget changes without updating the market, the test fails.

Terrain, leaf and minor-shadow channels use fixed pixel/shadow proxies because their dominant cost is not their visible triangle count.

## 4. The allocator now removes real work

This is not telemetry-only adaptive quality.

When a channel loses its bid:

- grass, ecology and horizon-canopy populations can lose the entire draw when allocation approaches zero
- the terrain shader skips its second-frequency color samples, high-frequency color sample, roughness samples and normal-map microband as its allocation falls
- authored leaf materials skip the added procedural depth/fleck shading under pressure while retaining their base texture
- minor fern/rock/log shadow casters are removed from the shadow pass before important image structure
- the forest-contact field keeps a protected representation but reduces CPU refresh frequency as its allocation falls

Stable deterministic populations are retained. Recovery reveals the same latent scene rather than rerolling vegetation.

## 5. Frame pacing still controls the wallet

The existing EMA + hysteresis governor remains the time-domain controller. Sustained slow frames shrink the wallet quickly. Sustained headroom restores it slowly. The new market sits downstream and decides how that wallet is spent.

This separation is deliberate:

- governor = **how much work can this machine afford now?**
- market = **where is that work worth spending?**

## 6. Why this is a frontier step

Modern foveated and variable-rate rendering systems exploit the same broad fact: image regions and shading work do not have equal perceptual value. Proof 8 applies that principle at a higher semantic level inside a browser game. Instead of varying only pixel shading rate, Alderwatch can trade whole representations, shader frequency bands, vegetation draws and secondary shadow work against one another.

The renderer therefore stops treating every graphics subsystem as an independent claimant on frame time.

## Court

The new Court proves:

- one global budget constraint across all 17 channels
- exact protected floors and hard upper bounds
- budget is filled without overspend across the quality range
- every channel is monotone under increasing frame headroom
- severe pressure preserves hero grass while eliminating horizon/vista work first
- geometry work coefficients remain derived from frozen shipping budgets
- runtime allocation reaches actual mesh visibility, material uniforms, shader branches and shadow participation
- no new texture or model payload

## Acceptance

Passing the Court does not prove beauty or performance on a real browser/GPU. This release survives only if live play demonstrates two things together:

1. frame pressure removes visually cheap work before obvious nearby detail, without distracting pumping; and
2. when headroom exists, the full Proof-7 horizon image returns intact.

Live screenshots, GPU timing and frame pacing outrank the model of cost. The market coefficients are explicitly falsifiable and should be retuned from real measurements when available.
