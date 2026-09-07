import type {AnimalKind} from './wildlife-species';

export interface WildlifeSpawn {
 id:string;
 kind:AnimalKind;
 x:number;
 z:number;
 yaw:number;
 packId?:string;
}

/**
 * Stable additive IDs are part of save compatibility: seedNature only creates missing rows.
 * Keep authored encounter placement here, not mixed into steering or combat code.
 */
export const WILDLIFE_SPAWNS:readonly WildlifeSpawn[]=[
 {id:'wildlife-0',kind:'hare',x:4,z:14,yaw:0},{id:'wildlife-1',kind:'hare',x:-5,z:-17,yaw:1},{id:'wildlife-hare-2',kind:'hare',x:12,z:46,yaw:2.2},{id:'wildlife-hare-3',kind:'hare',x:-18,z:67,yaw:4.1},
 {id:'wildlife-2',kind:'crow',x:3,z:3,yaw:2},{id:'wildlife-3',kind:'crow',x:-4,z:-38,yaw:3},{id:'wildlife-crow-4',kind:'crow',x:24,z:82,yaw:.8},{id:'wildlife-crow-5',kind:'crow',x:-31,z:116,yaw:5.2},
 {id:'pasture-goat-0',kind:'goat',x:14,z:20,yaw:.4},{id:'pasture-goat-1',kind:'goat',x:18,z:24,yaw:1.2},{id:'pasture-goat-2',kind:'goat',x:22,z:29,yaw:2.1},{id:'pasture-goat-3',kind:'goat',x:12,z:34,yaw:4.8},{id:'pasture-goat-4',kind:'goat',x:19,z:37,yaw:3.7},
 {id:'pasture-sheep-0',kind:'sheep',x:-14,z:19,yaw:2.2},{id:'pasture-sheep-1',kind:'sheep',x:-18,z:23,yaw:3.1},{id:'pasture-sheep-2',kind:'sheep',x:-23,z:28,yaw:.7},{id:'pasture-sheep-3',kind:'sheep',x:-13,z:33,yaw:5.4},{id:'pasture-sheep-4',kind:'sheep',x:-21,z:37,yaw:1.8},
 {id:'southwood-deer-0',kind:'deer',x:24,z:91,yaw:1.7},{id:'southwood-deer-1',kind:'deer',x:31,z:98,yaw:4.2},{id:'southwood-deer-2',kind:'deer',x:38,z:106,yaw:.9},{id:'southwood-deer-3',kind:'deer',x:27,z:113,yaw:3.5},
 {id:'southwood-deer-4',kind:'deer',x:-31,z:132,yaw:2.7},{id:'southwood-deer-5',kind:'deer',x:-39,z:140,yaw:5.7},{id:'southwood-deer-6',kind:'deer',x:-47,z:149,yaw:1.1},{id:'southwood-deer-7',kind:'deer',x:-35,z:156,yaw:4.6},
 {id:'high-meadow-bison-0',kind:'bison',x:88,z:58,yaw:.5},{id:'high-meadow-bison-1',kind:'bison',x:96,z:64,yaw:1.5},{id:'high-meadow-bison-2',kind:'bison',x:104,z:56,yaw:2.4},{id:'high-meadow-bison-3',kind:'bison',x:111,z:67,yaw:4.1},{id:'high-meadow-bison-4',kind:'bison',x:101,z:73,yaw:5.2},
 // Two packs, each capped at three. High-meadow wolves are placed to produce a visible bison hunt;
 // ridge wolves roam the same ecology but start far enough away not to dogpile the herd immediately.
 {id:'wolf-high-meadow-0',kind:'wolf',x:127,z:55,yaw:4.4,packId:'high-meadow'},{id:'wolf-high-meadow-1',kind:'wolf',x:131,z:61,yaw:4.1,packId:'high-meadow'},{id:'wolf-high-meadow-2',kind:'wolf',x:128,z:68,yaw:3.8,packId:'high-meadow'},
 {id:'wolf-ridge-0',kind:'wolf',x:151,z:98,yaw:5.1,packId:'east-ridge'},{id:'wolf-ridge-1',kind:'wolf',x:156,z:104,yaw:4.7,packId:'east-ridge'},{id:'wolf-ridge-2',kind:'wolf',x:149,z:109,yaw:5.4,packId:'east-ridge'},
 {id:'ironward-bear',kind:'bear',x:198,z:72,yaw:2.8},{id:'briar-bear',kind:'bear',x:-214,z:154,yaw:5.1},{id:'southwood-bear',kind:'bear',x:76,z:201,yaw:3.6},
];

export function packSize(packId:string){return WILDLIFE_SPAWNS.filter(spawn=>spawn.kind==='wolf'&&spawn.packId===packId).length;}
