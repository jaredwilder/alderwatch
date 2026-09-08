import type {AnimalKind} from './wildlife-species';

export const MAX_WOLF_PACK_SIZE=3;
export const MAX_EAGLES=3;
export interface WildlifeSpawn {
 id:string;
 kind:AnimalKind;
 x:number;
 z:number;
 yaw:number;
 packId?:string;
 /** Previous shipping home used only to migrate untouched legacy saves onto the wider distribution. */
 legacyHome?:readonly [number,number];
}

const moved=(id:string,kind:AnimalKind,x:number,z:number,yaw:number,legacyX:number,legacyZ:number,packId?:string):WildlifeSpawn=>({id,kind,x,z,yaw,packId,legacyHome:[legacyX,legacyZ]});
const fresh=(id:string,kind:AnimalKind,x:number,z:number,yaw:number,packId?:string):WildlifeSpawn=>({id,kind,x,z,yaw,packId});

/**
 * Encounter anchors are intentionally spread across the full playable March.
 * Solitary animals and herd centres use broad Poisson-disc-like spacing; herd/pack
 * members remain locally clustered so they still read as social groups.
 *
 * IDs stay stable for save compatibility. moved(...) keeps the previous home so
 * seedNature can rehome only untouched living legacy animals once.
 */
export const WILDLIFE_SPAWNS:readonly WildlifeSpawn[]=[
 // Small wildlife: a light starter-area presence, then broad regional coverage.
 moved('wildlife-0','hare',28,40,0,4,14),
 moved('wildlife-1','hare',-42,126,1,-5,-17),
 moved('wildlife-hare-2','hare',75,174,2.2,12,46),
 moved('wildlife-hare-3','hare',-88,214,4.1,-18,67),
 moved('wildlife-hare-4','hare',138,118,.7,27,18),
 moved('wildlife-hare-5','hare',-156,96,3.4,-28,11),
 moved('wildlife-hare-6','hare',205,188,1.8,42,52),
 moved('wildlife-hare-7','hare',-228,182,5.1,-45,58),
 moved('wildlife-hare-8','hare',276,90,2.9,19,78),
 moved('wildlife-hare-9','hare',-278,258,.2,-11,92),

 moved('wildlife-2','crow',-32,44,2,3,3),
 moved('wildlife-3','crow',35,96,3,-4,-38),
 moved('wildlife-crow-4','crow',-70,178,.8,24,82),
 moved('wildlife-crow-5','crow',95,236,5.2,-31,116),
 moved('wildlife-crow-6','crow',-132,254,1.4,31,35),
 moved('wildlife-crow-7','crow',188,68,4.4,-36,42),
 moved('wildlife-crow-8','crow',-204,122,2.3,55,94),
 moved('wildlife-crow-9','crow',265,198,.6,-57,101),

 // Keep one modest village-edge pasture instead of twenty bodies on top of Alderbrook.
 moved('pasture-goat-0','goat',25,52,.4,14,20),
 moved('pasture-goat-1','goat',31,58,1.2,18,24),
 moved('pasture-goat-2','goat',22,63,2.1,22,29),
 moved('pasture-goat-3','goat',35,66,4.8,12,34),
 // The remainder become an Ironward hill-goat herd.
 moved('pasture-goat-4','goat',164,24,3.7,19,37),
 moved('pasture-goat-5','goat',171,30,5.3,27,22),
 moved('pasture-goat-6','goat',179,22,.9,31,29),
 moved('pasture-goat-7','goat',184,34,2.8,28,36),
 moved('pasture-goat-8','goat',160,38,4,8,43),
 moved('pasture-goat-9','goat',176,42,1.6,24,44),

 moved('pasture-sheep-0','sheep',-45,50,2.2,-14,19),
 moved('pasture-sheep-1','sheep',-52,56,3.1,-18,23),
 moved('pasture-sheep-2','sheep',-58,62,.7,-23,28),
 moved('pasture-sheep-3','sheep',-48,68,5.4,-13,33),
 // Briar Heath gets a second flock instead of another central clump.
 moved('pasture-sheep-4','sheep',-154,80,1.8,-21,37),
 moved('pasture-sheep-5','sheep',-162,87,.5,-29,19),
 moved('pasture-sheep-6','sheep',-171,79,4.9,-32,27),
 moved('pasture-sheep-7','sheep',-180,91,2.7,-30,36),
 moved('pasture-sheep-8','sheep',-151,96,1,-10,44),
 moved('pasture-sheep-9','sheep',-169,101,3.8,-25,43),

 // Four five-head deer herds: Southwood, deep Southwood, Ironward and Briar.
 moved('southwood-deer-0','deer',28,178,1.7,24,91),
 moved('southwood-deer-1','deer',36,184,4.2,31,98),
 moved('southwood-deer-2','deer',42,174,.9,38,106),
 moved('southwood-deer-3','deer',22,190,3.5,27,113),
 moved('southwood-deer-4','deer',34,197,2.7,-31,132),

 moved('southwood-deer-5','deer',-65,252,5.7,-39,140),
 moved('southwood-deer-6','deer',-74,260,1.1,-47,149),
 moved('southwood-deer-7','deer',-82,250,4.6,-35,156),
 moved('southwood-deer-8','deer',-69,269,.4,9,72),
 moved('southwood-deer-9','deer',-88,268,2.1,17,80),

 moved('southwood-deer-10','deer',182,121,5.2,47,86),
 moved('southwood-deer-11','deer',191,129,3.3,54,99),
 moved('southwood-deer-12','deer',203,122,1.2,-12,103),
 moved('southwood-deer-13','deer',188,140,4,-20,113),
 moved('southwood-deer-14','deer',209,137,2.6,63,124),

 moved('southwood-deer-15','deer',-196,158,.8,71,136),
 moved('southwood-deer-16','deer',-208,166,5.6,-63,118),
 moved('southwood-deer-17','deer',-218,157,2.4,-72,131),
 moved('southwood-deer-18','deer',-203,177,4.9,18,149),
 moved('southwood-deer-19','deer',-224,174,1.5,29,163),

 // Bison are now two remote meadow herds instead of one cluster beside the centre.
 moved('high-meadow-bison-0','bison',118,225,.5,88,58),
 moved('high-meadow-bison-1','bison',129,231,1.5,96,64),
 moved('high-meadow-bison-2','bison',139,220,2.4,104,56),
 moved('high-meadow-bison-3','bison',238,248,4.1,111,67),
 moved('high-meadow-bison-4','bison',249,257,5.2,101,73),
 // Deliberate discovery anchor: this stable ID deterministically yields the Massive rare-beast trait.
 fresh('wild-bison-1','bison',258,247,1.9),

 // Three aerial territories, one per major wilderness direction.
 moved('eagle-pasture-0','eagle',18,205,1.2,-5,58),
 moved('eagle-southwood-0','eagle',214,173,4.5,19,104),
 moved('eagle-high-meadow-0','eagle',-188,209,2.7,76,82),

 // Two three-wolf packs; each overlaps prey but the packs no longer sit side-by-side.
 moved('wolf-high-meadow-0','wolf',151,214,4.4,127,55,'ironward-meadow'),
 moved('wolf-high-meadow-1','wolf',157,220,4.1,131,61,'ironward-meadow'),
 moved('wolf-high-meadow-2','wolf',154,228,3.8,128,68,'ironward-meadow'),
 moved('wolf-ridge-0','wolf',-240,183,5.1,151,98,'briar-heath'),
 moved('wolf-ridge-1','wolf',-247,190,4.7,156,104,'briar-heath'),
 moved('wolf-ridge-2','wolf',-251,179,5.4,149,109,'briar-heath'),

 // Solitary apex territories at three distant edges of the playable realm.
 moved('ironward-bear','bear',286,118,2.8,198,72),
 moved('briar-bear','bear',-288,232,5.1,-214,154),
 moved('southwood-bear','bear',76,292,3.6,76,201),
];

export function packSize(packId:string){return WILDLIFE_SPAWNS.filter(spawn=>spawn.kind==='wolf'&&spawn.packId===packId).length;}
