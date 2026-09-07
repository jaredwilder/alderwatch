# Alderwatch Ecology 2.0 — The Wilderness Plays Its Own Game

## North star

> **A medieval survival game where the wilderness is continuously playing its own game.**

Alderwatch should not feel like a map populated with independent animal NPCs waiting for the player to activate them. The world should feel as though it has been running before the player arrived, keeps running while the player is elsewhere, and develops consequences that the player can discover, interrupt, exploit, worsen, or repair.

The differentiator is not simply “more animals.” It is **causal ecology**:

- prey movement changes predator movement;
- failed hunts cost energy;
- successful hunts create carcasses;
- carcasses attract other animals;
- exhaustion makes predators vulnerable;
- populations change local pressure on forage;
- player hunting alters future encounters;
- nests, hives, dens, tracks, feathers, blood and remains reveal events that actually happened;
- rare events emerge from simulation state rather than from a fake quest timer.

The desired player reaction is not “the game generated another encounter.” It is:

> **“What the hell happened here?”**

followed by:

> **“I need to see what happens next.”**

That curiosity is the retention engine. Do not replace it with login streaks, expiring rewards, fake scarcity, loot-box psychology, or punishment for stopping play. Alderwatch should be difficult to put down because the world produces meaningful unfinished stories, not because a UI threatens the player.

---

## Current foundation

The game already has the beginnings of a real food web:

- hares and crows;
- goats and sheep;
- deer;
- bison herds;
- bears;
- wolf packs capped at three;
- wolves hunting bison and escalating when a player interferes;
- eagles hunting hare, sheep and crow;
- eagles physically carrying some prey;
- eagle flight energy, exhaustion, forced landing and ground recovery;
- exhausted grounded eagles becoming valid wolf/bear prey;
- persistent animal health and carcasses;
- persistent carcass loot;
- beehives producing harvestable honey;
- additive wildlife saves;
- deterministic encounter seeds and stable IDs.

This is enough machinery to stop treating ecology as “content” and promote it into a first-class simulation system.

---

# Design principles

## 1. Causality over spectacle

Every memorable wildlife event should have a reason that exists in game state.

Bad:

- spawn wolf near player because tension meter says so;
- play eagle attack animation because random event fired;
- create a carcass as decoration.

Good:

- hungry wolf pack selected the nearest viable bison herd;
- chase cost energy and separated one bison from the herd;
- bison died through normal combat authority;
- carcass remains in the world;
- bear later detects the carcass;
- player finds tracks and remains and can reconstruct the event.

The simulation does not need scientific fidelity at every layer. It does need **causal integrity**.

## 2. Persistent consequences

Important state survives distance, reloads and player absence.

Persist when gameplay-relevant:

- health/injury;
- hunger/energy;
- age/life stage when introduced;
- territory/home range;
- pack/herd membership;
- aggression memory;
- current hunt/carry state;
- nests/dens/hives;
- carcasses;
- population pressure;
- major migration/rare-event state.

Do not persist meaningless animation noise.

## 3. Legibility

A simulation that nobody can read is just background CPU usage.

The player should infer ecological state from the world:

- tracks;
- blood trails;
- feathers/fur;
- disturbed vegetation;
- alarm calls;
- circling scavengers;
- clustered prey behavior;
- abandoned nests;
- dens;
- half-eaten carcasses;
- predator vocalization;
- changes in local abundance.

Eventually an experienced player should be able to look at deer bunching against a treeline and think: “something is pushing them from the south.”

## 4. Bounded simulation

The wilderness may be alive; it may not become an uncontrolled population bomb.

Every species must have explicit bounds:

- regional carrying capacity;
- minimum viable population reserve where appropriate;
- maximum active agents near player;
- maximum reproduction rate;
- maximum predator density;
- maximum pack/herd size where applicable;
- migration/despawn rules at world edges;
- starvation and mortality pressure;
- off-screen simulation cadence.

Population control must emerge primarily from ecology, then be protected by hard safety rails.

## 5. No invisible cheating unless it protects the simulation

Do not secretly teleport a wolf onto the player because the game feels quiet.

Acceptable invisible corrections:

- stop two populations from numerically exploding due to simulation error;
- prevent an off-screen predator from exterminating a unique population;
- migrate excess animals out of the represented region;
- coarse-resolve distant events instead of running full physics.

If the game corrects state, preserve causal plausibility.

## 6. Architecture before species count

New animals must be data-first.

Do not add a new `if (kind === 'whatever')` to every subsystem.

Existing ownership remains the baseline:

- `wildlife-species.ts` — species tuning and relationships;
- `wildlife-spawns.ts` — stable authored encounter seeds;
- `wildlife-ai.ts` — pure terrestrial decision helpers;
- `wildlife-aerial.ts` — aerial energy/carry/takeoff/landing rules;
- `wildlife-rules.ts` — health, damage, death and carcass authority;
- `animal-models.ts` — GLB/animation/model normalization;
- `nature.ts` — runtime orchestration and presentation;
- future population/needs/evidence modules must follow the same split.

---

# Ecology state model

The goal is a small number of meaningful conserved pressures rather than a biology PhD simulator.

## Per-animal state

Add only when the behavior consuming it exists.

### Energy

Represents immediate physical reserve.

Costs:

- sprinting;
- fighting;
- flying;
- carrying prey;
- fleeing;
- cold/weather later if useful.

Recovers through:

- rest;
- feeding;
- species-specific recovery rates.

Consequences:

- slower chase;
- abandoning a hunt;
- forced eagle landing;
- inability to attack continuously;
- vulnerability after exertion.

### Hunger

A slower pressure than energy.

Hunger determines **why** predators take risks and why herbivores spend time foraging.

A full predator should often ignore prey or the player. A starving predator may contest a carcass, attack livestock, approach roads, or attempt dangerous prey.

### Injury

Do not reduce injury to health percentage alone.

A simple persistent injury tier can alter:

- top speed;
- turn rate;
- willingness to hunt;
- preferred prey size;
- recovery time;
- vulnerability to other predators.

This creates emergent stories such as an injured wolf switching from bison to scavenging.

### Fear / threat memory

Animals should remember dangerous places and recent attackers for a bounded period.

Examples:

- repeatedly hunted deer avoid a clearing;
- surviving wolves become wary near a player settlement;
- livestock bunch after predator activity;
- prey return gradually rather than instantly forgetting.

### Age / life stage

Only introduce after reproduction is ready.

Useful coarse stages:

- juvenile;
- adult;
- old.

No need for continuous genetic simulation initially.

### Territory / home range

Animals already have `home`. Ecology 2.0 should promote this into readable territorial behavior:

- den/nest anchor;
- preferred feeding area;
- patrol radius;
- seasonal/migration override;
- conflict between overlapping predators.

---

# Trophic layers

The long-term loop is:

**plants → insects → small herbivores → ungulates/livestock → predators → scavengers → decomposition → plants**

Not every layer needs individual agents.

## Plants / forage

Regional forage pressure should be a scalar/grid field, not millions of simulated plants.

Inputs:

- rainfall/weather later;
- soil/biome;
- grazing intensity;
- trampling;
- decomposition nutrients;
- player harvesting.

Outputs:

- local herbivore carrying capacity;
- visible grass/flower abundance;
- hive productivity;
- migration pressure.

## Insects / pollination

Bees do not need individual AI.

Beehives can own:

- colony strength;
- forage radius;
- honey reserve;
- disturbance state;
- swarm/reproduction event chance.

Nearby flowering abundance influences hive output. Healthy hives can modestly improve nearby plant recovery.

## Small prey

Hares become important because they connect vegetation to eagles, fox-like future predators, and opportunistic carnivores.

## Herd animals

Deer, sheep, goats and bison should have:

- forage pressure;
- herd cohesion;
- fear propagation;
- vulnerable members;
- migration when local forage/threat balance becomes poor.

## Predators

Predators must make economic decisions:

**expected food value vs energy cost vs injury risk.**

A bear should not endlessly chase a healthy bison because “bison is in prey list.”

A wolf pack can coordinate against bison because pack size changes expected success.

An exhausted eagle should stop being a sky god and become food.

## Scavengers

Crows already exist. They can become the first true scavenger layer.

Future behavior:

- detect carcasses;
- gather around them;
- consume a carcass resource fraction;
- alert the player visually to nearby death;
- flee when major predators arrive.

This makes crows ecological information, not just Crow Milk manufacturing equipment.

## Decomposition

Carcasses should have stages:

1. fresh;
2. scavenged;
3. bones/remains;
4. gone.

Each stage changes attraction and loot.

A finished carcass can increase a tiny local fertility field rather than disappear without consequence.

---

# Predation simulator

## Hunt lifecycle

Predation should become an explicit state machine:

1. **Need** — predator hunger crosses motivation threshold.
2. **Search** — predator selects a viable hunting area/prey.
3. **Assess** — prey size, distance, pack support, energy and injury risk are evaluated.
4. **Approach** — stalking/flanking/intercept behavior.
5. **Commit** — chase begins and burns energy.
6. **Attack** — authoritative combat/damage only.
7. **Outcome** — kill, escape, injury or abandonment.
8. **Feed / guard / carry** — species-specific post-kill behavior.
9. **Recovery** — predator rests and becomes temporarily less aggressive.

Every hunt can fail.

Failure is important because it creates cost, movement and vulnerability.

## Pack hunting

Wolf packs remain capped at three unless explicitly redesigned.

Roles can remain deterministic:

- leader closes;
- flankers offset;
- one may intercept fleeing prey.

Avoid expensive tactical planners. Stable role assignment from pack ordering is enough.

## Aerial predation

Eagles are the prototype for a distinct movement ecology.

Rules:

- flight has energy cost;
- carrying has severe additional cost;
- prey weight affects drain;
- exhausted birds must land;
- grounded recovery is slow;
- grounded birds are reachable by terrestrial predators;
- takeoff requires an energy threshold and physical clearance;
- nests can become home/recovery anchors later.

## Predator vs predator

Do not immediately turn this into constant deathmatch behavior.

Use resource conflict:

- bear approaches wolf carcass/kill;
- wolves decide whether pack strength justifies contest;
- lone wolf yields;
- injured predator yields more readily;
- territorial conflicts are short and costly.

---

# Population simulation

## Regional populations

Move gradually from “fixed spawn roster” toward **seeded populations with stable individuals**.

For each ecology region track:

- current live population by species;
- births/juveniles;
- deaths;
- immigration;
- emigration;
- forage pressure;
- predator pressure;
- recent disturbance.

## Reproduction

Reproduction should be slow and conditional.

Inputs:

- adequate food;
- adequate adult population;
- low enough local stress;
- species season/cooldown;
- carrying capacity.

Never reproduce simply because `count < target` every few minutes.

## Migration

Migration is the preferred pressure-release valve.

If local conditions become bad:

- deer leave a depleted/unsafe region;
- excess wolves disperse;
- bison shift grazing range;
- birds relocate.

This lets population numbers move without visibly spawning/despawning beside the player.

## Hard safety rails

Each region/species also gets:

- absolute maximum population;
- maximum births per world-day;
- minimum interval between replenishment;
- protected seed reserve for essential prey where needed;
- off-screen predator kill budget.

These are simulation circuit breakers, not the visible ecology.

---

# Off-screen simulation

Do not run full Three.js movement, collision and animation for the whole world.

Use three simulation levels.

## Level A — active bubble

Near the player:

- full movement;
- real steering;
- animation;
- line of sight;
- combat;
- physical carrying;
- visible evidence generation.

## Level B — nearby coarse ecology

Outside presentation distance but within the current region:

- state updates every few seconds;
- no rendered movement;
- hunt probabilities resolved from actual energy/hunger/population state;
- positions move between plausible anchors;
- outcomes still create persistent carcasses/evidence.

## Level C — distant population model

Far regions:

- aggregate updates on long cadence;
- births/deaths/migration/forage pressure only;
- no individual chase simulation;
- important outcomes instantiate individual state when the region becomes relevant.

The player must never pay a frame-time tax for wildlife they cannot perceive.

---

# World evidence and ecological mysteries

This is the layer that converts simulation into fascination.

Create persistent lightweight evidence records:

- footprints / track trails;
- blood;
- feathers;
- fur;
- broken vegetation;
- drag marks;
- scat if we truly lose control of ourselves;
- half-eaten remains;
- bones;
- nests;
- dens;
- abandoned prey.

Evidence has:

- source event ID;
- world position;
- age;
- decay time;
- type;
- optional species attribution.

A player following evidence is following **history**, not a decorative breadcrumb quest.

Example chain:

> player finds sheep wool → tracks lead uphill → eagle is carrying a lamb → eagle exhausts and lands → wolves smell/see vulnerable eagle → player interferes → wolf pack abandons eagle and turns on player → player later discovers the wolves' den.

No quest designer scripted the entire chain.

---

# Player influence

The player should be able to become an ecological force accidentally or deliberately.

Examples:

- hunt wolves → deer become more common/bolder;
- more deer → heavier grazing pressure;
- depleted forage → deer migrate toward farms/roads;
- leave carcasses → scavengers and bears become locally common;
- build livestock pens → concentrated prey attracts predators;
- protect hives / plant flowers → stronger honey production;
- overharvest hives → colony weakness;
- clear forest → changes cover and hunting success;
- build palisades → reroutes animal movement;
- repeatedly hunt one valley → animals learn to avoid it.

The key is **second-order consequence**. The player should occasionally solve one problem and create another.

---

# Rare events without FOMO

Rare events should emerge from valid state and remain possible forever.

Candidates:

- unusually large stag;
- albino/leucistic animal;
- migrating bison movement;
- wolf dispersal pair;
- injured territorial bear;
- eagle nesting pair;
- bee swarm creating a new hive;
- predator conflict over a carcass;
- unusually harsh prey winter later;
- orphaned juvenile;
- disease event only if it adds gameplay rather than invisible attrition.

Rules:

- never “log in tonight or miss it”;
- never daily streak-gate;
- never fake scarcity countdown;
- rarity comes from simulation conditions and probability over ordinary play;
- missed events leave evidence when possible.

---

# Compelling-play doctrine

Alderwatch can borrow the useful part of engagement psychology without building coercive dark patterns.

## Autonomy

Player chooses what to investigate and whether to interfere.

## Competence

Tracking and ecological reading become learnable skills.

## Immediate feedback

Animals react visibly to changing threat, hunger, wounds and terrain.

## Long arcs

Population shifts and territories create multi-session consequences.

## Variable outcomes from real systems

Uncertainty comes from many interacting agents, not a slot-machine reward table.

## Natural “one more thing” chains

Every resolved event can expose another question:

- what killed this deer?
- where did the wolves go?
- why are the crows circling?
- why is this pasture empty?
- where did the eagle carry that sheep?
- why did the bears suddenly move west?

The player stops because they choose to stop, not because the game punishes them for leaving.

---

# Proposed module expansion

Do not put the following into `nature.ts`.

Suggested modules as systems become real:

- `wildlife-needs.ts` — energy, hunger, feeding, rest and injury modifiers;
- `wildlife-populations.ts` — carrying capacity, birth/death/migration pressure;
- `wildlife-evidence.ts` — tracks, blood, feathers, remains and decay;
- `wildlife-territory.ts` — dens/nests/home-range pressure;
- `wildlife-scavenging.ts` — carcass attraction and consumption;
- `ecology-regions.ts` — region definitions and aggregate fields;
- `ecology-forage.ts` — vegetation/forage pressure and recovery;
- `ecology-simulation.ts` — coarse off-screen stepping only.

`nature.ts` remains runtime orchestration/presentation.

Simulation logic should be pure enough to test without Three.js wherever practical.

---

# Build order

## Phase 0 — Stabilize current food web

Already largely present.

- wolf packs → bison;
- eagles → hare/sheep/crow;
- eagle exhaustion → terrestrial vulnerability;
- bears → prey/carcasses;
- beehives → honey;
- persistent carcasses;
- population caps.

Exit condition: no spinning/orbiting regressions, no unreachable combat, no off-screen mass extinction.

## Phase 1 — Needs and hunt economics

Add energy/hunger to terrestrial predators and major prey.

Deliver:

- chase cost;
- hunt abandonment;
- feeding restores hunger/energy;
- full predators stop constantly hunting;
- injuries affect hunt choice.

This is the first major leap from animal AI to ecosystem simulation.

## Phase 2 — Carcass lifecycle and scavenging

Deliver:

- carcass food reserve;
- feeding consumes reserve;
- crows scavenge;
- bears contest kills;
- carcasses decay to remains;
- visual evidence persists.

## Phase 3 — Regional forage pressure

Deliver:

- coarse forage field;
- herbivore feeding;
- local depletion/recovery;
- migration pressure;
- hive output responds to flowers/forage.

## Phase 4 — Population dynamics

Deliver:

- births under valid conditions;
- juveniles;
- mortality;
- immigration/emigration;
- hard caps and kill budgets;
- long-run balance tests.

## Phase 5 — Territory, nests and dens

Deliver:

- wolf dens;
- bear home ranges;
- eagle nests;
- nesting/recovery behavior;
- territory influences encounters.

## Phase 6 — Evidence / tracking game

Deliver:

- tracks;
- blood;
- feathers/fur;
- drag trails;
- remains;
- journal/bestiary observations based on what the player actually witnesses.

## Phase 7 — Player ecological influence

Deliver:

- hunting pressure memory;
- livestock attraction;
- carcass baiting;
- habitat changes;
- hive management;
- visible second-order consequences.

## Phase 8 — Rare emergent events

Deliver rare, non-expiring ecology states once the base simulation can support them causally.

---

# Required simulation tests

Every ecology expansion should add deterministic long-run tests.

At minimum:

1. **No extinction by idle simulation** over a representative long run unless intentionally possible and recoverable.
2. **No unbounded population growth.**
3. **Predator energy conservation:** repeated failed hunts reduce hunting capability.
4. **Successful feeding changes future behavior.**
5. **Carcass mass/food is never duplicated.**
6. **A carried prey animal cannot simultaneously participate in another hunt/herd decision.**
7. **Airborne prey cannot be hit by ground predators.**
8. **Grounded/exhausted aerial predators are reachable.**
9. **Pack/herd caps remain enforced.**
10. **Off-screen coarse simulation and active simulation preserve the same state invariants.**
11. **Reload preserves meaningful ecology state.**
12. **Player absence does not allow the coarse simulator to erase the whole food web.**

Add seeded Monte Carlo / soak tests once population dynamics exist. The target is not one magical equilibrium; it is a broad stable envelope with interesting fluctuations.

---

# Performance budget

Alive does not mean expensive.

Rules:

- full AI only in player bubble;
- aggregate distant ecology;
- no individual bee simulation;
- no global pathfinding every frame;
- stable deterministic steering where possible;
- reuse spatial indexes once populations grow;
- cap active predators/herds per region;
- evidence uses pooled/lightweight rendering;
- animations are presentation, never authority.

Measure before increasing density.

---

# Success criteria

Ecology 2.0 succeeds when all of these become true:

- A ten-minute walk routinely produces at least one wildlife event that did not need a quest script.
- The player can infer predator presence before seeing the predator.
- At least one event can be reconstructed from persistent evidence after it happened.
- Predator hunts can succeed **and fail** for state-dependent reasons.
- A predator's behavior after eating differs meaningfully from when starving.
- Killing a meaningful number of one species measurably changes a region later.
- The simulation remains bounded across long unattended tests.
- New species can be added primarily through registry data plus one focused behavior module when genuinely necessary.
- The player occasionally says some version of: **“Wait—did that happen because of what we did earlier?”**

That last reaction is the product.

---

# The promise

Alderwatch should eventually support stories like this without a scripted quest:

> A wolf pack pushes a bison herd out of the high meadow. One bison is wounded but escapes. The wolves burn too much energy and abandon the chase. Crows find the blood trail. An eagle comes down for the crows, spends too much energy carrying a hare on the way back, and lands near the wounded bison. A bear follows the bison scent, steals an old wolf kill, and forces the exhausted eagle away on foot. The player arrives later, sees feathers, wolf tracks and blood, and follows the evidence into a completely different encounter.

Nothing spawned because the player crossed an invisible quest trigger.

**The wilderness was already playing.**
