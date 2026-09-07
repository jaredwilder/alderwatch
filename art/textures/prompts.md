# ALDERWATCH production texture prompts

Generated with built-in image_gen, one call per asset. The selected source PNGs are preserved in this project under `art/textures/`, with optimized WebP runtime copies.

## Woodland soil — surface repair pass, September 6

Project source: `art/textures/soil.png`. Original generation: `exec-5d58aa35-bd73-49c9-a978-b663fcd64bbb.png`. Built-in image generation; no API fallback.

Use case: stylized-concept. Asset type: seamless square tileable albedo texture for Alderwatch, a grounded adult medieval frontier game with hand-painted stylized PBR. Primary request: warm grey-brown compacted woodland soil, sparse tiny pale limestone pebbles, a restrained scattering of small dry oak leaves and fine root fragments, patches of low olive moss. Viewed perfectly top-down orthographic, fills the entire square evenly, neutral flat diffuse lighting with no cast shadows, no perspective, no vignette. Covers about 3 meters of terrain so leaves and pebbles are small and not focal elements. Mostly exposed muted earth, not dense foliage, not grass, not an illustration of a landscape. Rich finely painted natural material detail but subdued contrast so it can be tiled across a game world without looking noisy. Seamlessly matching opposite edges. No text, no frames, no people, no trees, no large objects, no watermark. Opaque texture.

## Oak bark

## Fern undergrowth — visual priority pass, September 6

Source: `art/textures/fern.png`; runtime: `public/textures/fern.webp`. Built-in image generation, original `exec-523d6cf2-19c6-415d-939d-d357b24fa58a.png`. Used on curved Blender-authored foliage cards; alpha test 0.5. Inspected generated output and actual in-game fern clusters.

Use case: stylized-concept. Asset type: production RGBA fern atlas for an adult grounded medieval forest game, hand-painted natural PBR. Exactly FOUR isolated lush woodland fern fronds in a 2-by-2 grid, each a complete arching fern spray with a thin curved stem, many slender paired serrated pinnae, deep forest green bases, restrained sage and olive tips, fine realistic leaf veins. Each frond rises from a small common base, seen from the side at a useful angle for a 3D game foliage card. Four distinct natural curved silhouettes, entire frond visible in its quadrant, generous transparent margins. Truly TRANSPARENT BACKGROUND with real alpha, every space between leaflets transparent. Neutral diffuse lighting without cast shadows. Delicate botanical structure, original detailed game material, NOT broad triangular leaves, not cartoon, not white pale foliage. No ground, pot, roots, background, sky, text, lines, watermark or checkerboard. Square atlas, exactly four independent components, no overlap between quadrants.

## Thatch — house-kit pass, September 6

Source: `art/textures/thatch.png`; runtime: `public/textures/thatch.webp`. Built-in image generation, original `exec-0a877c7e-421a-4d13-bc1b-0b1a3b201b30.png`.

Use case: stylized-concept. Asset type: original seamless square tileable thatched-roof albedo texture for Alderwatch, grounded adult medieval hand-painted PBR game. Entire image is the flat surface of tightly packed weathered water reeds and straw, fibers running VERTICALLY from top to bottom. Fine broken stems, mixed old warm grey-brown reeds and subdued golden wheat straw, natural irregular density and subtle age, occasional very restrained dark moss traces. Premium hand-painted natural material detail, not cartoon, not photographic gloss. Covers roughly 1.5 meters square of thatch, detailed fine fibers but no huge distinctive bundles. Neutral flat diffuse lighting without baked directional shadows or highlights. Front-on orthographic flat continuous material surface; seamless opposite edges with no row borders. Opaque. No house, no roof outline, no perspective, no sky, no branches, no rope, no frame, no labels, no watermark.

## Oak bark (original atlas)

File: exec-f9b86f43-35a4-4a00-853f-2bcc09bf6af0.png

Use case: stylized-concept
Asset type: production oak bark albedo texture for ALDERWATCH, a grounded stylized medieval survival game.
Primary request: one square seamless tileable 1024-by-1024-ish oak bark diffuse color texture, edge-to-edge. This is a flat material texture asset, not a scene, object or concept illustration.
Subject/material: mature oak bark, warm gray-brown and muted taupe ridges, narrow dark earthy brown vertical furrows, complex irregular branching fissures, chunky worn bark plates with gently chipped edges. Natural low-amplitude variation, grounded sophisticated hand-painted PBR game texture quality coherent with realistic adult medieval forest survival environment.
Composition: orthographic surface scan of bark, completely flat and front-on. Bark pattern continues seamlessly across both left-right and top-bottom edges; balanced even detail scale across entire square. No one dominant knot or recognizable feature; avoid obvious repetition.
Lighting/color: diffuse albedo only; even neutral flat illumination with no directional lighting, no highlights, no drop shadows or ambient occlusion baked in. Natural warm gray-brown, modest local color contrast. Dark crevices represented as pigmentation only, no rendered height shadows.
Constraints: only the seamless bark texture filling the entire square. No tree silhouette, trunk edges, branches, leaves, environment, text, border, UI, logo or watermark. No spherical material preview, perspective, gradients, plastic, voxel art or photographic flash. Opaque output.

## Meadow ground

File: exec-7ee88c6c-5afe-4b4b-bae0-409eb5aed874.png

Use case: stylized-concept
Asset type: production meadow ground albedo texture for ALDERWATCH, a grounded stylized medieval survival game.
Primary request: one square seamless tileable 1024-by-1024-ish meadow ground diffuse color texture, edge-to-edge. Flat material texture asset, not landscape art.
Subject/material: natural small fine grasses, low moss and weathered earthy ground. Rich varied natural greens, sage, olive, yellow-green grass tips, muted brown earth showing irregularly between little grass blades and moss. Dense microtexture at coherent fine scale with a natural mixed meadow floor character. Sophisticated hand-painted PBR game texture style with believable plant detail, not cartoon. Quiet overall variation so it tiles well, with no large distinctive landmark.
Composition: strict top-down orthographic flat surface view, no perspective, horizon or depth of field. Seamlessly continuing material across left/right and top/bottom edges, no border. Meadow foliage and earth cover the entire image. Small grass and moss patches distributed evenly, earth integrated between plants without long paths.
Lighting/color: pure diffuse albedo, flat neutral even illumination, no directional sunlight, no baked highlights, cast shadows, ambient occlusion or vignette. Color detail only.
Constraints: opaque square image consisting only of tileable meadow ground surface. No tall grass silhouettes, trees, flowers, rocks, logs, buildings, character, text, logo, UI, watermark, checkerboard, material sphere, perspective render, black shadows or photographic flash.

## Oak foliage atlas

File: exec-d5f7e44a-dda1-4ce7-85fd-e104852b1b97.png

Use case: stylized-concept
Asset type: production oak foliage atlas for alpha-cutout leaf cards in ALDERWATCH, grounded stylized medieval survival game.
Primary request: one square PNG atlas with a GENUINELY TRANSPARENT BACKGROUND and real alpha channel. Exactly four small separate leafy oak branch clusters arranged in four quadrants with ample transparent padding between clusters and at every outer edge. No branch touches another quadrant.
Subject: each quadrant contains a distinct natural small branching twig spray with broad LOBED OAK leaves, beautifully shaped rounded oak lobes, slight variation of leaf angles, some overlapping leaves and ample small transparent gaps between leaves. Fine visible brown branching twigs, medium spring/summer greens with subtle warm green-gold tips. The four clusters are variations of the same oak species and asset style. Each spray is an irregular organic silhouette, not a circular bunch.
Style/material: sophisticated hand-painted PBR game foliage, grounded material definition, softly painted veins and natural color variation coherent with a high-end indie 3D medieval oak forest. Leaf surfaces mostly front facing so leaves remain useful as billboard leaf-card textures. Attractive readable silhouettes at small size.
Composition: flat texture-atlas sheet, orthographic top-down isolated foliage components, one roughly centered cluster per quadrant, each cluster within its own invisible quadrant bounds, wide transparent central cross gap and 8 percent overall outer padding. Four clusters only.
Lighting/color: flat diffuse leaf albedo, neutral even illumination, no cast shadows or drop shadows, no strong baked directional highlights. Natural greens with restrained gold-green.
Constraints: actual transparency, not a drawn checkerboard or white/black/colored background. Every gap between leaves transparent. No ground, tree trunk, landscape, sky, labels, visible atlas lines, text, watermark, logo, UI or border. No collage backdrop, material preview spheres, plastic, voxel, tiny unreadable mass of leaves, photo of foliage on a table, duplicated identical sprays. Preserve crisp anti-aliased leaf edges and alpha.

## Weathered oak timber

File: exec-f51d64f0-131e-4e3a-a7ed-7b924b784176.png

Use case: stylized-concept
Asset type: original production weathered oak timber albedo for ALDERWATCH medieval survival game.
Primary request: one square 1024-ish seamless tileable weathered oak wood diffuse-color texture. Flat continuous wood surface filling the entire square, vertical grain.
Material: muted warm brown and gray mature oak timber, subtle narrow irregular vertical grain, soft worn fibers, subtle small naturally distributed knots and restrained hairline cracks. Sophisticated premium hand-painted/stylized PBR game material grounded in natural wood. Low-contrast broad variation, readable fine grain, no large unique focal knot.
Composition: front-on orthographic material texture, no perspective, no surface outline. Seamless across left-right and top-bottom edges.
Lighting: albedo only, completely neutral flat even illumination. No directional lighting, baked ambient occlusion, cast shadows, specular highlights, vignette or gradient.
Constraints: only continuous timber texture; no plank seams, boards, nails, bolts, tree bark, separate objects, buildings, text, border, watermark, logo, UI, materials sphere or scene. Natural colors and grounded medieval art direction, never toy-like, plastic or cartoon. Opaque output.

## Limestone

File: exec-7404f086-36b7-457e-8151-5ad73729f03d.png

Use case: stylized-concept
Asset type: original production limestone/boulder surface albedo for ALDERWATCH medieval survival game.
Primary request: one square 1024-ish seamless tileable irregular natural limestone diffuse-color texture. A flat continuous rock surface filling the entire square.
Material: warm gray/taupe limestone with fine irregular fissures, subtle grain and chalky weathered patches, occasional restrained pale sage-gray lichen integrated into the stone. Sophisticated premium hand-painted/stylized PBR game material with grounded natural detail and muted natural color. Balanced fine and medium irregular pattern, modest contrast. No large dominant identifiable shape.
Composition: front-on orthographic surface scan, no perspective, no outline or separate boulder. Seamlessly repeating across left-right and top-bottom edges.
Lighting: pure albedo, neutral flat even diffuse illumination. No directional light, dark occlusion cavities, cast shadows, highlights, vignette, gradient or rendered volume.
Constraints: ONLY continuous limestone surface. No separate stones or boulders, masonry blocks, mortar seams, ground, sand pile, tree, landscape, scene, text, border, watermark, logo, UI or material sphere. No plastic, toy or cartoon style. Opaque square output.

## Grass atlas

File: exec-eacbca55-3ec4-412f-afcd-2374570d135b.png

Use case: stylized-concept
Asset type: original production transparent meadow grass atlas for ALDERWATCH medieval survival game, intended for alpha-cutout grass cards.
Primary request: one square 1024-ish RGBA PNG containing exactly FOUR distinct isolated meadow grass tufts in a neat 2-by-2 grid on a GENUINELY TRANSPARENT BACKGROUND with a real alpha channel.
Subject: four natural meadow grass tuft variations, each a small grounded cluster of narrow rich-green blades arising from a compact common base and gently splaying outward/upward. Mix fresh green with a few dry golden blades and occasional delicate golden seed heads on taller stems. Premium hand-painted/stylized PBR natural material detail; readable attractive varied silhouettes, grounded medieval landscape style, no toy or cartoon look.
Composition: each complete tuft in its own quadrant, seen straight-on from a useful grass-card side view, entire tuft visible including blade tips and compact stem bases. Each grass tuft remains strictly within its quadrant. Ample transparent padding between all four tufts and around outer edges; no elements touch or overlap another quadrant. Four independent organic variations, not exact duplicates.
Lighting/color: neutral even diffuse illumination, natural deep to fresh greens with restrained golden dry details. No baked cast or drop shadows, directional highlights, ground shadows or vignette.
Constraints: transparent alpha in all space outside blades/stems and all gaps between blades. NO soil, ground chunks, roots ball, ground plane, pot, sky, landscape, background, shadows, checkerboard picture, white/black fill, text, logo, watermark, border, visible grid lines or UI. Do not crop any tuft tips or bases. Crisp antialiased alpha edges.

## Validation and limits

- The four surface textures are opaque 24-bit RGB. All were prompted as seamless albedo with neutral lighting. Tileability and physically clean albedo have not been mechanically guaranteed by the generator; evaluate on repeating materials before release.
- Oak foliage and grass atlases are true 32-bit ARGB with alpha values spanning 0 to 255. Oak foliage has about 57% fully transparent sampled pixels; grass has about 47%.
- Both atlases contain four separated organic clusters in quadrants, viewed and inspected in generated previews.
- The grass preview shows red/green colors around some transparent edges. Read-only pixel sampling found zero saturated red pixels with alpha over 127; colored RGB occurs in transparent or low-alpha pixels. An alpha-test material with cutoff 0.5 removes sampled red fringes; mipmapped alpha blending should be inspected for color bleed.
- No game project files were edited. No API fallback, credits or resets were used.
