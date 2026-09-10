# The Tipsy Alder — fourth-pass live regression note

Live acceptance after PR #142 exposed a discoverability regression: the tavern/sign vanished from Alderbrook until the player entered a 48m lazy-construction radius. The recorded downtown approach position from the live screenshot is roughly (-76.8, 89.0), about 136m from the tavern district centre (-9.3, -29.4), so the frontage was intentionally absent while already inside the player's visual approach.

This pass keeps the third-pass lifecycle/performance architecture but moves tavern construction ahead of visual discovery: synchronous construction inside 180m and idle prewarm beginning at 220m. The porch interaction remains strictly scoped to the actual porch footprint, so the original global `E · Enter The Tipsy Alder` bug stays dead.

Acceptance: the tavern sign/frontage is visible from the normal Alderbrook road approach, `E` still appears only on the porch, and entry/exit/interior behavior remains unchanged.
