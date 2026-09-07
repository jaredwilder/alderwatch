# Alderwatch — player request ledger

This is the running player-facing delivery ledger. Update it whenever Jared makes a concrete game request. A request is **SHIPPED** only after implementation, tests/build, merge, deployment, and live verification where available. Do not silently replace a request with a smaller proxy.

## Current ledger

| Status | Request | Delivery evidence / acceptance condition |
|---|---|---|
| SHIPPED | Bow must visibly exist on the HUD and be usable | Hotbar slot 5 + bow combat path live before this ledger. |
| SHIPPED | Wildlife should be encountered much more often | Common wildlife roster substantially expanded with additive persistent IDs; predator caps preserved. |
| SHIPPED | Camps must stop looking like primitive/procedural toy scenes | First CC0 Quaternius camp dressing pass shipped; player reported the visual delta was still too small, so the stronger request below supersedes visual acceptance. |
| ACTIVE THIS ROUND | **Use the already-real third-party assets aggressively enough that a refresh looks materially different.** Do not hide the change in tiny props. | Promote complete CC0 buildings/landmarks (huts, watchtowers, barracks, market, town center, windmill, well, storage, walls, farm) plus lived-in props; establish visible South Gate/Alderbrook/regional landmark silhouettes and whole-asset frontier camps. |
| ACTIVE THIS ROUND | Preserve existing work; the asset raid is **on top of**, not instead of, current systems. | No movement/combat/camera/save-system redesign. Existing authored kit and gameplay structures remain. |
| ACTIVE THIS ROUND | Ultima Online-style skill-by-use progression on meaningful actions. | Successful use awards visible **+0.1** skill; 100.0 cap. Combat, hunting, timber, mining, forage, cooking, crafting, building and camping covered. |
| ACTIVE THIS ROUND | Show skill increases in the gameplay HUD with a scroll/bar treatment. | Persistent skill summary button plus transient `SKILL INCREASE · +0.1` feed. |
| ACTIVE THIS ROUND | Add a character profile with earned titles such as **Grandmaster Bowman**. | Character record lists skills, decimal values, ranks and progress bars; title follows strongest practiced skill; Archery 100.0 = `Grandmaster Bowman`. |
| ACTIVE / PERMANENT | Keep a running ledger of game requests and get stricter about delivery. | This file is now a repository-level handoff requirement; future sessions update it before marking player-facing work complete. |

## Delivery rule

Player-visible claims are judged by the live game, not by code volume. If a screenshot still reads the same after a visual pass, the visual request remains open even if assets were technically integrated.
