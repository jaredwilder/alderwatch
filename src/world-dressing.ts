import type {WorldState} from './state';

export type DressingPlacement=readonly [name:string,x:number,z:number,yaw:number,scale:number,yOffset?:number];
export interface DressingCluster {x:number;z:number;yaw:number;items:readonly (readonly [name:string,lx:number,lz:number,scale:number,extraYaw:number])[]}
export interface DressingZone {x:number;z:number;r:number;label:string}

/** Close-camera layouts use the detailed MegaKit assemblies and compact props. */
export const SOUTH_GATE_PLACEMENTS:readonly DressingPlacement[]=[
 ['village_details',-11,-4,.10,.92,.01],['village_details',10,-6,-.10,.86,.01],
 ['palisade',-7.2,4,.04,.92,.01],['palisade',7.2,4,-.04,.92,.01],
 ['market',-17,-5,.12,.95,.01],['storage',7,-3,-.18,.92,.01],['well',-5,-1,.15,1,.01],
 ['wood_pile',-6.4,8,.2,1,.01],['barrel',7.3,8,-.2,1,.01],['barrel',8.4,8.4,.36,.9,.01],
 ['lantern',-3.5,7,.05,1,.02],['lantern',3.5,7,-.05,1,.02],
];

/**
 * Alderbrook is a close-up playable settlement. Do not put the simplified RTS
 * skyline pieces here: they are useful at landmark distance, but their broad
 * silhouette meshes read as enormous slabs when the player walks underneath.
 */
export const ALDERBROOK_PLACEMENTS:readonly DressingPlacement[]=[
 ['well',1.5,-29,.05,1,.01],['market',-6,-28,.12,1,.01],['storage',22,-40,-.2,1,.01],
 ['village_details',25,-68,3.1,.88,.01],['village_details',-27,-49,.15,.90,.01],['village_details',-26,-67,.08,.86,.01],
 ['village_details',3,-77,Math.PI,.92,.01],['hut_d',29,-90,-.15,.82,.01],['farm',-31,-82,.08,.9,.01],['crops',-23,-84,.08,.9,.01],
 ['wood_pile',-2,-35,.1,1,.01],['hay',7,-37,-.15,1,.01],['barrel',10,-30,.4,1,.01],['barrel',11,-31,-.2,.9,.01],
];

/** RTS silhouettes live only at landmark distance, where their simple geometry reads well. */
export const REGIONAL_CLUSTERS:readonly DressingCluster[]=[
 {x:118,z:52,yaw:.08,items:[['watchtower',0,0,1,0],['barracks',-8,5,.86,.12],['storage',7,5,.9,-.2],['wall',-5,-3,.9,.05],['wall',5,-3,.9,-.05],['wood_pile',5,8,1,.2],['barrel',-5,8,1,.3]]},
 {x:205,z:35,yaw:-.12,items:[['towerhouse',0,0,.92,0],['watchtower',9,-2,.88,.1],['market',-9,3,.92,-.1],['wall',5,6,.9,.2],['wall',-5,6,.9,-.2],['well',0,7,1,0]]},
 {x:52,z:146,yaw:.18,items:[['hut_d',0,0,.92,0],['storage',7,3,.9,.2],['well',-6,4,1,0],['wood_pile',4,-4,1,.3],['hay',-4,-4,1,-.2]]},
 {x:-126,z:92,yaw:-.1,items:[['towerhouse',0,0,.78,0],['storage',7,4,.9,-.2],['market',-7,4,.86,.2],['well',0,7,1,0],['barrel',4,-3,.95,.3]]},
 {x:-210,z:142,yaw:.14,items:[['watchtower',0,0,.95,0],['barracks',-8,4,.84,.18],['storage',8,4,.9,-.18],['wall',-5,-4,.9,.08],['wall',5,-4,.9,-.08],['torch',0,6,1,0]]},
];

export const STATIC_DRESSING_ZONES:readonly DressingZone[]=[
 {x:0,z:1,r:18,label:'South Gate'},
 {x:0,z:-39,r:21,label:'Upper Alderbrook'},
 {x:0,z:-69,r:31,label:'Lower Alderbrook'},
 ...REGIONAL_CLUSTERS.map((c,i)=>({x:c.x,z:c.z,r:13,label:`Regional landmark ${i+1}`})),
];

export function dressingZones(state:WorldState):DressingZone[]{
 const dynamic=[...Object.values(state.frontier?.sites??{}),...Object.values(state.expeditionSites??{}),...Object.values(state.bountySites??{})];
 return [...STATIC_DRESSING_ZONES,...dynamic.map(s=>({x:s.position[0],z:s.position[2],r:8.5,label:s.name}))];
}
export function insideDressingZone(x:number,z:number,zones:readonly DressingZone[],padding=0){return zones.some(zone=>Math.hypot(x-zone.x,z-zone.z)<zone.r+padding);}
