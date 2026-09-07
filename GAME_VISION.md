BUILD ME A COMPLETE, PLAYABLE, BEAUTIFUL BROWSER-BASED 3D MEDIEVAL SURVIVAL / ACTION RPG.

DO NOT GIVE ME A DESIGN DOCUMENT.
DO NOT ASK ME QUESTIONS.
DO NOT BUILD A TECH DEMO.
BUILD THE GAME.

This should feel like a serious commercial indie game prototype, not an AI-generated toy, tutorial project, low-effort survival clone, or collection of primitive boxes.

HIGH-LEVEL FANTASY

A dangerous medieval frontier where players begin with almost nothing, gather resources, build a home and fortified base, craft increasingly powerful weapons and armor, cook meals that provide meaningful buffs, explore for rare resources and treasure, fight monsters/NPC enemies, raid hostile strongholds, defend what they have built, and eventually fight OTHER PLAYERS for territory, loot, resources, and control.

The long-term architecture must support multiplayer PvP, even if the first playable build uses local simulated opponents where networking is not practical yet.

Think:

V Rising
+
Valheim
+
Rust-style territorial tension
+
Diablo-style loot excitement
+
excellent tactile survival gathering
+
medieval settlement / fortress building

But create an original identity.

TITLE

Create a strong original medieval title and logo treatment.

Do NOT make the entire game dark because the title sounds ominous.

DEFAULT WORLD PRESENTATION

Beautiful readable DAYLIGHT.

Blue sky.
Warm sunlight.
Green forests.
Golden fields.
Stone roads.
Timber villages.
Rivers.
Mountains in the distance.
Wind in trees and grass.
Atmospheric haze.
Strong readable shadows.

Dusk, rain, storms, fog and night can happen dynamically and should feel dramatic precisely because the normal world is bright and beautiful.

ART DIRECTION

ADULT MEDIEVAL.

Grounded.
Hand-painted / stylized PBR.
Detailed enough to feel premium.
Not photorealistic.
Not childish.
Not chibi.
Not plastic.
Not voxel.
Not Fisher-Price fantasy.
No tiny toy trees.
No giant heads.
No floating weapons.
No random primitive geometry pretending to be finished art.

Characters should have believable adult human proportions.

Visual language:
weathered wood
iron
steel
leather
linen
chainmail
stone
thatch
moss
mud
wild grass
cloth banners
smoke
embers
campfires

Color should be rich but natural.

STARTING EXPERIENCE

The game must immediately feel polished.

Create a cinematic TITLE SCREEN with:

- animated 3D medieval environment behind the menu
- subtle camera motion
- ambient wind / fire / village sound
- strong original logo
- NEW GAME
- CONTINUE
- MULTIPLAYER / ONLINE — may say “coming online” if networking is not implemented yet
- SETTINGS
- CREDITS

Then a CHARACTER SELECTION / CREATION screen.

Offer several starting archetypes, for example:

WARDEN
Balanced melee / building

HUNTER
Bow / mobility / tracking

REAVER
Heavy melee / raiding

ARTISAN
Crafting / construction / resource efficiency

These are STARTING specialties, not permanently locked classes.

Show each character as an animated full-body 3D model with equipment.

Allow at least:
body / face preset
hair
hair color
skin tone
starting archetype

Then begin the game with a short atmospheric camera sequence introducing the world.

CORE CONTROLS

Responsive modern third-person / elevated-action controls.

WASD movement.

Mouse controls camera / aim.

Shift sprint.

Space dodge or contextual movement action.

Left click primary attack / tool use.

Right click block / alternate attack / aim depending on equipment.

E interact / pickup.

1–8 hotbar.

Tab inventory.

B building mode.

C crafting / character menu as appropriate.

The player MUST FACE THE DIRECTION THEY ARE MOVING unless intentionally aiming / attacking.

NO moonwalking.
NO skating.
NO character floating around while feet do nothing.

MOVEMENT QUALITY IS A RELEASE BLOCKER.

Use a proper character controller / physics solution rather than inventing crude movement if an established library is available.

CHARACTER ANIMATION

This is extremely important.

Actual skeletal:
idle
walk
run
sprint
turn
attack
heavy attack
block
dodge
hit reaction
death
axe chopping
pickaxe mining
hammer building
bow draw/fire if ranged weapons exist

Transitions should blend.

Foot motion should reasonably match world velocity.

Do not translate a static character while pretending they are walking.

WEAPONS AND TOOLS MUST BE ATTACHED TO VERIFIED HAND BONES / SOCKETS.

If a proper hand socket cannot be found, FAIL LOUDLY.

NEVER attach a sword, axe, pickaxe or hammer to pelvis/root/body-center as a fallback.

Weapons must physically move with the animated hand.

GATHERING MUST FEEL GOOD

Trees should be LARGE and believable.

A mature tree should tower over the character.

Chopping:

equip axe
approach tree
swing real axe animation
axe visibly contacts tree
wood chips / bark particles
strong impact sound
small camera impulse
tree accumulates damage/notches
final blow causes readable cracking
tree physically falls
trunk becomes logs / harvestable wood
logs remain physically in world
player manually collects them

NO:
tree disappears into inventory
instant resource vacuum
spinning player
fake weapon rotation independent of arms

Mining:

pickaxe animation
visible rock impact
stone chips
multiple hits
rock fractures
stone pieces remain in world

RESOURCE TYPES

Start with:

wood
stone
fiber
hide
food
iron ore
coal
herbs
clay

Then unlock rarer tiers such as:

copper
iron
steel
silver
black iron / equivalent endgame material

CRAFTING

Create meaningful progression.

TOOLS:
wood / crude
stone
bronze or iron
steel
high-tier forged

WEAPONS:
sword
axe
spear
mace
dagger
bow
crossbow
two-handed sword
warhammer

ARMOR:
cloth
leather
mail
plate
specialized sets

Actual visible equipment changes on the character.

Gear should have:
damage / armor
durability if appropriate
quality tier
rarity
bonuses / affixes on better items

Suggested rarity:
Common
Fine
Rare
Epic
Relic

But keep colors tasteful.

Do not make the world look like a mobile-game casino.

INVENTORY AND LOOT

Create a real inventory.

Grid or slot-based.

Visible:
weapon
helmet
chest
gloves
legs
boots
offhand
back/accessory

Items can be:
equipped
moved
stacked
dropped
stored
salvaged

World loot should physically appear.

Add:
chests
barrels
ruined carts
enemy drops
rare caches
treasure sites

COOKING / FOOD

Cooking must matter mechanically.

Do NOT make food only an annoying hunger punishment.

Foods grant temporary strategic buffs.

Examples:

Grilled Venison
+maximum health

Hearty Stew
+health + stamina

Hunter’s Breakfast
+movement / stamina regen

Ironroot Soup
+armor

Spiced Boar
+melee damage

Berry Tart
+resource gathering

Rare Feast
multiple strong bonuses

Add:
campfire
cooking pot
oven later
ingredient combinations
better recipes unlocked through progression

BUILDING SYSTEM

This needs to feel like a real survival game.

Player can place:

foundation / floor
walls
doors
windows
roof pieces
stairs
support beams
fences
gates
palisades

Snap intelligently.

Allow rotation.

Show valid / invalid build preview.

Allow dismantling with partial refund.

Structures must visually connect reasonably.

HOUSE BUILDING

Players should be able to create an actual home.

Inside the home:
bed / respawn point
storage
decorations
fireplace
crafting stations
trophy displays

Shelter should matter.

BASE / SETTLEMENT STRUCTURES

Beyond ordinary house pieces, build functional structures that upgrade the settlement.

Examples:

WORKBENCH
basic crafting

BLACKSMITH
metal weapons / armor

SMELTER
ore processing

TANNERY
leather gear

KITCHEN
advanced food

HERB GARDEN
renewable herbs

FARM
crops

WOODCUTTER YARD
wood efficiency

STONECUTTER
stone structures

ARMORY
combat equipment / defenses

WATCHTOWER
vision / ranged defense

BALLISTA
base defense

PALISADE
early fortification

STONE WALL
advanced fortification

GATEHOUSE
controlled entry

BARRACKS
NPC guards / future clan soldiers

STABLE
future mounts

Each structure should visibly improve and unlock something.

PROGRESSION

Progress through:
exploration
gear
materials
crafting stations
recipes
building tiers
character skills
bosses / dangerous territories
PvP territory control later

Avoid arbitrary XP grinding as the only progression.

SKILL SYSTEM

Include useful progression categories such as:

Combat
Gathering
Crafting
Building
Cooking
Survival

Repeated actions can improve proficiency, but progression must not become tedious.

WORLD

Do not create a flat empty lawn.

Build a composed world with:

forest
meadow
road
river or pond
rocky area
ruins
small village
bandit / raider camp
mine entrance
distant landmark
elevation changes

Use:
foreground
midground
background landmarks

Roads should visually lead somewhere.

Clearings should feel intentional.

Forest density should create mystery and navigation.

Add wildlife.

Examples:
deer
boar
wolves

HOSTILE ENEMIES

Bandits / raiders
wolves
undead in cursed areas
armored mercenaries
special elites

Give enemies different behavior.

Not everything runs directly at the player.

Use:
melee
archers
shield enemies
fast enemies
heavy enemies

COMBAT

Combat must feel responsive.

light attacks
heavy attacks
blocking
parry if appropriate
dodge
stamina
hit reactions
knockback / stagger
critical hits
weapon-specific reach and timing

Different weapons need different identity.

Sword ≠ axe ≠ spear ≠ warhammer.

Add good:
impact sound
hit sparks
blood kept tasteful
dust
camera response
enemy reaction

PVP / MULTIPLAYER ARCHITECTURE

THIS IS IMPORTANT.

Do NOT design the world as a single-player-only throwaway architecture.

The long-term game should support:

players occupying the same persistent world
clans / guilds
player-built bases
raiding
territory
resource competition
duels
open-world PvP zones or rule sets
alliances
sieges
loot risk

Separate authoritative GAME STATE from presentation.

Use stable IDs for:
players
items
containers
structures
resource nodes
projectiles
enemies

Avoid architecture that assumes one global local player everywhere.

If actual networking is practical, implement a basic multiplayer foundation.

If not, create clean interfaces so networking can be added without rewriting the game.

Add a MULTIPLAYER menu placeholder communicating the intended modes:

Official Realm
Private Realm
LAN / Host Game
Join by Code

Do not fake online networking if it is not actually working.

PVP GAMEPLAY VISION

Eventually another player should be able to:

see my settlement
trade with me
duel me
ambush me
steal exposed resources
raid my outer defenses
siege my clan fortress
fight over rare mining locations

Therefore building, inventory and combat systems must already be multiplayer-compatible conceptually.

PVE STILL MATTERS

PvP is NOT the only content.

The world should remain fun when other players are absent.

PvE supplies:
resources
bosses
danger
events
dungeons
progression
rare loot

The desired destination is PvPvE.

PLAYER BASE DEFENSE

Periodic hostile pressure may exist, but DO NOT make the entire identity of the game “night raids.”

Possible threats:
bandit raid
wolf attack
undead incursion
enemy scouting party
future player raid

Base defenses should actually work.

NPCs

Add useful NPCs eventually:

blacksmith
merchant
cook
hunter
farmer
guard

NPCs can improve the settlement and offer services / quests / trading.

UI

The UI should be restrained, premium and medieval.

Use:
weathered parchment
dark iron
leather
wood
subtle brass

But retain excellent readability.

HUD:
health
stamina
status buffs
hotbar
interaction prompts

Do not cover the screen with giant panels.

Menus:
inventory
equipment
crafting
building
character
map

Use tooltips and meaningful icons.

MAP

Include a proper world map.

Discover areas through exploration.

Mark:
home
settlements
resources
dungeons
enemy camps
future player territories

AUDIO

Audio is crucial.

Add satisfying:
footsteps by surface
axe hits
wood cracking
tree fall
pick impacts
stone fracture
metal weapon impacts
bow
fire
wind
birds
water
village ambience

Music should be sparse and atmospheric rather than constant heroic noise.

PERFORMANCE

THIS IS A BROWSER GAME.

Maintain good performance.

Use:
instancing
LOD
culling
sensible texture sizes
compressed GLTF/GLB
object pooling where useful
limited expensive post-processing

Do not sacrifice responsiveness for pointless graphical effects.

ARCHITECTURE

Build cleanly.

Separate:
rendering
game state
input
player controller
combat
items
inventory
equipment
crafting
building
world/resources
AI
save system
network-ready state

Use data-driven definitions for items, recipes, structures and equipment rather than hardcoding every item's behavior independently.

SAVE SYSTEM

Persist:
character
inventory
equipment
skills
structures
storage
world progression
opened loot
crafted unlocks
settings

VISUAL ACCEPTANCE TEST

The game fails if the opening scene looks like:

flat green plane
random cylinders
random cubes
toy-scale trees
unanimated character sliding
weapons floating near pelvis
constant darkness
placeholder programmer art dominating the scene

FIRST PLAYABLE ACCEPTANCE SEQUENCE

The following sequence must feel polished before considering the project successful:

TITLE SCREEN
↓
CHARACTER SELECTION
↓
SPAWN IN BEAUTIFUL DAYLIGHT
↓
WALK
↓
TURN
↓
SPRINT
↓
STOP
↓
EQUIP AXE
↓
CHOP LARGE TREE WITH REAL ANIMATION
↓
TREE FALLS
↓
PICK UP LOGS
↓
MINE ROCK
↓
CRAFT SWORD
↓
FIGHT ENEMY
↓
COOK FOOD
↓
GAIN FOOD BUFF
↓
BUILD SMALL HOUSE
↓
BUILD WORKBENCH
↓
CRAFT BETTER EQUIPMENT
↓
EXPLORE ENEMY CAMP
↓
RETURN WITH LOOT

If you must reduce scope to finish a stable first build, reduce WORLD SIZE and NUMBER OF ITEMS.

DO NOT reduce:
movement quality
animation quality
character quality
weapon attachment correctness
gathering feel
lighting
basic building quality

A small excellent game beats a huge pile of broken mechanics.

FINAL DIRECTIVE

Treat this as the foundation of a REAL COMMERCIAL GAME.

Reuse excellent existing libraries, controllers, animation systems and open/licensed assets where appropriate instead of rebuilding solved technology badly.

Make strong design decisions yourself.

Do not stop to ask me routine questions.

Do not merely tell me what you would build.

BUILD AS MUCH OF THIS AS POSSIBLE INTO A COMPLETE PLAYABLE PROJECT.

The standard is:

“I cannot believe this was generated from one prompt.”

GO.