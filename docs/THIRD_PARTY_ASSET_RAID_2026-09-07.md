# Third-party medieval asset raid — 2026-09-07

Goal: stop hand-building toy-looking camps when mature free game-art libraries already exist.

## Sources researched

### Quaternius — Medieval Village MegaKit
- License: CC0 1.0; free for personal, educational and commercial projects.
- Formats: FBX, OBJ, glTF.
- 300+ modular environment pieces; free Standard slice is 60–70% of the pack.
- Alderwatch already had a pinned, optimized mirror of the free Standard kit in `jm-sky/seedvale`, so this round expands that trusted source instead of adding a new flaky host/runtime dependency.
- Source: https://quaternius.com/packs/medievalvillagemegakit.html

### Quaternius — Medieval Village Pack
- License: CC0.
- 44 medieval buildings/props, FBX/OBJ/Blend.
- Useful fallback if the MegaKit lacks a particular silhouette.
- Source: https://quaternius.com/packs/medievalvillage.html

### Kenney — Castle Kit
- License: CC0.
- 75 optimized 3D castle/medieval pieces.
- Strong candidate for later fortification/ruin silhouettes, but not mixed into this pass because the Quaternius material family is already live and visually coherent.
- Source: https://kenney.nl/assets/castle-kit

### OpenGameArt CC0 medieval collections
- Kenney Retro Medieval Kit: 120 GLB/FBX/OBJ objects, CC0.
- Daniel Andersson Medieval Props packs / containers: CC0, useful for tavern/smithy/market clutter; Blender-native so they would need a clean conversion path before shipping.
- Sources: https://opengameart.org/content/retro-medieval-kit and https://opengameart.org/content/cc0-assets

## Assets promoted in this round

Pinned from the already-audited Quaternius MegaKit mirror:

- `fence_wood_ext1.glb`
- `fence_wood_ext2.glb`
- `support.glb`
- `stairs_exterior.glb`
- `floor_wooddark.glb`
- `roof_wooden_2x1.glb`
- `wall_arch.glb`
- `vine_1.glb`
- `border_straight.glb`

Existing promoted assets (`crate`, `wagon`, `fence_wood_single`, etc.) are also used much more aggressively in frontier dressing.

## Integration rule

External art is acceptable when all of these are true:

1. commercial-compatible license is explicit;
2. source/revision is pinned;
3. local build validates a real GLB header and minimum file size;
4. assets are loaded through the existing asset system rather than runtime CDN calls;
5. authored collision/gameplay state remains authoritative;
6. style coherence beats raw asset count.

This is intentionally a visual-density raid, not a mechanics rewrite.
