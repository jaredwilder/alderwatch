import {height,roadX} from './terrain';
import type {ForageState,ItemId,WorldState} from './state';

export type SpecialGatherable='wild_garlic'|'juniper'|'sage'|'truffle'|'pine_resin';

const VISUAL_KIND:Record<SpecialGatherable,NonNullable<ForageState['kind']>>={
 wild_garlic:'herb',juniper:'berries',sage:'herb',truffle:'mushroom',pine_resin:'wood',
};

const random=(seed:number)=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const specialItem=(i:number):SpecialGatherable=>{
 const slot=i%11;
 if(slot===0)return 'truffle';
 if(slot===4||slot===8)return 'pine_resin';
 return (['wild_garlic','juniper','sage'] as const)[i%3];
};

/**
 * Adds a second persisted forage layer without rewriting the original nature-forage IDs.
 * Existing saves keep their gathered/respawn state; newly introduced nodes are additive.
 */
export function seedGatheringEconomy(w:WorldState){
 const rng=random(0xA1D3E5),count=44;
 for(let i=0;i<count;i++){
  const item=specialItem(i),id=`nature-economy-${i}`;
  if(w.forage[id])continue;
  const z=30-rng()*150,side=i%2?1:-1,x=roadX(z)+side*(8+rng()*23),y=height(x,z);
  if(y<-.75||Object.values(w.structures).some(s=>Math.hypot(x-s.position[0],z-s.position[2])<2.5)||Object.values(w.stations).some(s=>Math.hypot(x-s.position[0],z-s.position[2])<2)||Object.values(w.resources).some(r=>r.phase==='standing'&&Math.hypot(x-r.position[0],z-r.position[2])<1.4))continue;
  w.forage[id]={id,kind:VISUAL_KIND[item],item,position:[x,y,z],harvested:false};
 }
}

export function forageYield(item:ItemId){
 if(item==='fiber')return 4;
 if(item==='berries'||item==='juniper')return 3;
 if(item==='truffle'||item==='pine_resin'||item==='wild_honey')return 1;
 return 2;
}

export function forageRespawnSeconds(item:ItemId):number|undefined{
 if(item==='fiber')return undefined;
 if(item==='truffle')return 1200;
 if(item==='pine_resin')return 720;
 if(item==='wild_honey')return 600;
 if(item==='wild_garlic'||item==='juniper'||item==='sage')return 360;
 return 300;
}

export function forageBonus(item:ItemId):{item:ItemId;count:number}|undefined{
 return item==='wild_honey'?{item:'beeswax',count:1}:undefined;
}

export const SPECIAL_GATHERABLES:readonly SpecialGatherable[]=['wild_garlic','juniper','sage','truffle','pine_resin'];

// Browser follow-up: register the deep recipe ladder and compendium without coupling save seeding to UI code.
if(typeof document!=='undefined')void import('./crafting-expansion');
