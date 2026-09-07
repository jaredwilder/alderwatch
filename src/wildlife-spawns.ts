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
}

/** Stable additive IDs are part of save compatibility: seedNature only creates missing rows. */
export const WILDLIFE_SPAWNS:readonly WildlifeSpawn[]=[
 {id:'wildlife-0',kind:'hare',x:4,z:14,yaw:0},{id:'wildlife-1',kind:'hare',x:-5,z:-17,yaw:1},{id:'wildlife-hare-2',kind:'hare',x:12,z:46,yaw:2.2},{id:'wildlife-hare-3',kind:'hare',x:-18,z:67,yaw:4.1},
 {id:'wildlife-hare-4',kind:'hare',x:27,z:18,yaw:.7},{id:'wildlife-hare-5',kind:'hare',x:-28,z:11,yaw:3.4},{id:'wildlife-hare-6',kind:'hare',x:42,z:52,yaw:1.8},{id:'wildlife-hare-7',kind:'hare',x:-45,z:58,yaw:5.1},{id:'wildlife-hare-8',kind:'hare',x:19,z:78,yaw:2.9},{id:'wildlife-hare-9',kind:'hare',x:-11,z:92,yaw:.2},
 {id:'wildlife-2',kind:'crow',x:3,z:3,yaw:2},{id:'wildlife-3',kind:'crow',x:-4,z:-38,yaw:3},{id:'wildlife-crow-4',kind:'crow',x:24,z:82,yaw:.8},{id:'wildlife-crow-5',kind:'crow',x:-31,z:116,yaw:5.2},
 {id:'wildlife-crow-6',kind:'crow',x:31,z:35,yaw:1.4},{id:'wildlife-crow-7',kind:'crow',x:-36,z:42,yaw:4.4},{id:'wildlife-crow-8',kind:'crow',x:55,z:94,yaw:2.3},{id:'wildlife-crow-9',kind:'crow',x:-57,z:101,yaw:.6},
 {id:'pasture-goat-0',kind:'goat',x:14,z:20,yaw:.4},{id:'pasture-goat-1',kind:'goat',x:18,z:24,yaw:1.2},{id:'pasture-goat-2',kind:'goat',x:22,z:29,yaw:2.1},{id:'pasture-goat-3',kind:'goat',x:12,z:34,yaw:4.8},{id:'pasture-goat-4',kind:'goat',x:19,z:37,yaw:3.7},
 {id:'pasture-goat-5',kind:'goat',x:27,z:22,yaw:5.3},{id:'pasture-goat-6',kind:'goat',x:31,z:29,yaw:.9},{id:'pasture-goat-7',kind:'goat',x:28,z:36,yaw:2.8},{id:'pasture-goat-8',kind:'goat',x:8,z:43,yaw:4.0},{id:'pasture-goat-9',kind:'goat',x:24,z:46,yaw:1.6},
 {id:'pasture-sheep-0',kind:'sheep',x:-14,z:19,yaw:2.2},{id:'pasture-sheep-1',kind:'sheep',x:-18,z:23,yaw:3.1},{id:'pasture-sheep-2',kind:'sheep',x:-23,z:28,yaw:.7},{id:'pasture-sheep-3',kind:'sheep',x:-13,z:33,yaw:5.4},{id:'pasture-sheep-4',kind:'sheep',x:-21,z:37,yaw:1.8},
 {id:'pasture-sheep-5',kind:'sheep',x:-29,z:19,yaw:.5},{id:'pasture-sheep-6',kind:'sheep',x:-32,z:27,yaw:4.9},{id:'pasture-sheep-7',kind:'sheep',x:-30,z:36,yaw:2.7},{id:'pasture-sheep-8',kind:'sheep',x:-10,z:44,yaw:1.0},{id:'pasture-sheep-9',kind:'sheep',x:-25,z:47,yaw:3.8},
 {id:'southwood-deer-0',kind:'deer',x:24,z:91,yaw:1.7},{id:'southwood-deer-1',kind:'deer',x:31,z:98,yaw:4.2},{id:'southwood-deer-2',kind:'deer',x:38,z:106,yaw:.9},{id:'southwood-deer-3',kind:'deer',x:27,z:113,yaw:3.5},
 {id:'southwood-deer-4',kind:'deer',x:-31,z:132,yaw:2.7},{id:'southwood-deer-5',kind:'deer',x:-39,z:140,yaw:5.7},{id:'southwood-deer-6',kind:'deer',x:-47,z:149,yaw:1.1},{id:'southwood-deer-7',kind:'deer',x:-35,z:156,yaw:4.6},
 {id:'southwood-deer-8',kind:'deer',x:9,z:72,yaw:.4},{id:'southwood-deer-9',kind:'deer',x:17,z:80,yaw:2.1},{id:'southwood-deer-10',kind:'deer',x:47,z:86,yaw:5.2},{id:'southwood-deer-11',kind:'deer',x:54,z:99,yaw:3.3},
 {id:'southwood-deer-12',kind:'deer',x:-12,z:103,yaw:1.2},{id:'southwood-deer-13',kind:'deer',x:-20,z:113,yaw:4.0},{id:'southwood-deer-14',kind:'deer',x:63,z:124,yaw:2.6},{id:'southwood-deer-15',kind:'deer',x:71,z:136,yaw:.8},
 {id:'southwood-deer-16',kind:'deer',x:-63,z:118,yaw:5.6},{id:'southwood-deer-17',kind:'deer',x:-72,z:131,yaw:2.4},{id:'southwood-deer-18',kind:'deer',x:18,z:149,yaw:4.9},{id:'southwood-deer-19',kind:'deer',x:29,z:163,yaw:1.5},
 {id:'high-meadow-bison-0',kind:'bison',x:88,z:58,yaw:.5},{id:'high-meadow-bison-1',kind:'bison',x:96,z:64,yaw:1.5},{id:'high-meadow-bison-2',kind:'bison',x:104,z:56,yaw:2.4},{id:'high-meadow-bison-3',kind:'bison',x:111,z:67,yaw:4.1},{id:'high-meadow-bison-4',kind:'bison',x:101,z:73,yaw:5.2},
 {id:'high-meadow-bison-5',kind:'bison',x:116,z:48,yaw:.9},{id:'high-meadow-bison-6',kind:'bison',x:122,z:59,yaw:3.7},{id:'high-meadow-bison-7',kind:'bison',x:91,z:79,yaw:2.0},
 // Three territories, intentionally capped. Each overlaps a different prey pocket rather than blanketing the map.
 {id:'eagle-pasture-0',kind:'eagle',x:-5,z:58,yaw:1.2},
 {id:'eagle-southwood-0',kind:'eagle',x:19,z:104,yaw:4.5},
 {id:'eagle-high-meadow-0',kind:'eagle',x:76,z:82,yaw:2.7},
 // Two authored wolf encounters; every pack is statically guarded at MAX_WOLF_PACK_SIZE by tests.
 {id:'wolf-high-meadow-0',kind:'wolf',x:127,z:55,yaw:4.4,packId:'high-meadow'},{id:'wolf-high-meadow-1',kind:'wolf',x:131,z:61,yaw:4.1,packId:'high-meadow'},{id:'wolf-high-meadow-2',kind:'wolf',x:128,z:68,yaw:3.8,packId:'high-meadow'},
 {id:'wolf-ridge-0',kind:'wolf',x:151,z:98,yaw:5.1,packId:'east-ridge'},{id:'wolf-ridge-1',kind:'wolf',x:156,z:104,yaw:4.7,packId:'east-ridge'},{id:'wolf-ridge-2',kind:'wolf',x:149,z:109,yaw:5.4,packId:'east-ridge'},
 {id:'ironward-bear',kind:'bear',x:198,z:72,yaw:2.8},{id:'briar-bear',kind:'bear',x:-214,z:154,yaw:5.1},{id:'southwood-bear',kind:'bear',x:76,z:201,yaw:3.6},
];

export function packSize(packId:string){return WILDLIFE_SPAWNS.filter(spawn=>spawn.kind==='wolf'&&spawn.packId===packId).length;}
