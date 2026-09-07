# Player-visible stabilization gate — 2026-09-07

This release exists because unit-green subsystems are not enough if the live game is visually broken or hides shipped mechanics.

Release gate:

- the authored `highland` overlay must not render over the playable March;
- the live hotbar and keyboard surface must expose all five equipment slots, including the bow;
- wildlife events must reach the same player notice channel as human combat;
- aiming at living wildlife must expose health feedback;
- melee animal strikes and bow shots continue to resolve through authoritative wildlife combat;
- crow milk and wild honey participate in quick food selection;
- movement/camera behavior is not changed in this stabilization pass.

The orange/salmon region was a separate authored highland mesh intersecting the playable terrain, not the current March ground material. Do not restore that mesh to the live world until it has been spatially and materially validated away from playable ground.
