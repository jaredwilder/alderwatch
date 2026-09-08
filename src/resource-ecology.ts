import {forestDensity,forestEdge,meadowDensity} from './ecology';
import {height,roadX} from './terrain';
import type {ForageState,ItemId,ResourceState,Vec3,WorldState} from './state';

export const RESOURCE_ECOLOGY_VERSION='resource-ecology-v1';
export const RICH_RESOURCE_PREFIX='wild-resource-rich-';
export const RICH_FORAGE_PREFIX='nature-rich-';
export const RAW_FORAGE_ITEMS:readonly ItemId[]=['fiber','berries','mushroom','herb','wood','wild_garlic','juniper','sage','truffle','pine_resin','wild_honey'];
const WORLD_HALF=384,RESOURCE_STEP=18,FORAGE_STEP=12;

type Region='march'|'southwood'|'ironward'|'briar';
const region=(x:number,z:number):Region=>Math.abs(x)<85&&z<65?'march':x>95?'ironward':x<-95?'briar':'southwood';
const trailZ=(x:number)=>65+Math.sin(x*.027)*13;
const trailDistance=(x:number,z:number)=>Math.min(Math.abs(x-roadX(z)),Math.abs(z-trailZ(x)));
const random=(seed:number)=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
const cellSeed=(seed:number,x:number,z:number,salt:number)=>seed^Math.imul(x+4099,73856093)^Math.imul(z+8191,19349663)^salt;
const distance=(a:Vec3,b:Vec3)=>Math.hypot(a[0]-b[0],a[2]-b[2]);

function occupied(w:WorldState,p:Vec3,r:number){
 if(Math.abs(p[0])<31&&p[2]>-76&&p[2]<-20)return true; // Alderbrook yards and cottage footprints.
 if(Object.values(w.structures).some(s=>distance(s.position,p)<r))return true;
 if(Object.values(w.stations).some(s=>distance(s.position,p)<r))return true;
 if(Object.values(w.frontier?.sites??{}).some(s=>distance(s.position,p)<r+4))return true;
 if(Object.values(w.expeditionSites??{}).some(s=>distance(s.position,p)<r+4))return true;
 if(Object.values(w.bountySites??{}).some(s=>distance(s.position,p)<r+4))return true;
 return false;
}

function forageVisual(item:ItemId):NonNullable<ForageState['kind']>{
 if(item==='wild_honey')return 'wild_honey';
 if(item==='fiber')return 'fiber';
 if(item==='berries'||item==='juniper')return 'berries';
 if(item==='mushroom'||item==='truffle')return 'mushroom';
 if(item==='wood'||item==='pine_resin')return 'wood';
 return 'herb';
}

function weightedForage(rng:()=>number,x:number,z:number):ItemId{
 const woods=forestDensity(x,z),edge=forestEdge(x,z),meadow=meadowDensity(x,z),r=region(x,z);
 const weighted:[ItemId,number][]=[
  ['fiber',.08+meadow*.20],['berries',.10+edge*.22],['mushroom',.06+woods*.25],['herb',.11+meadow*.20],['wood',.05+woods*.18],
  ['wild_garlic',.08+edge*.18],['juniper',.055+(r==='briar'?.20:r==='ironward'?.10:.035)],['sage',.075+meadow*.15+(r==='ironward'?.06:0)],
  ['truffle',.007+woods*.035],['pine_resin',.02+woods*.12],['wild_honey',.009+edge*.035],
 ];
 let total=0;for(const [,weight] of weighted)total+=weight;let pick=rng()*total;
 for(const [item,weight] of weighted){pick-=weight;if(pick<=0)return item;}return 'herb';
}

export interface ResourceEcologySummary {resources:number;trees:number;rocks:number;forage:number;byItem:Partial<Record<ItemId,number>>;quadrants:[number,number,number,number]}
export function resourceEcologySummary(w:WorldState):ResourceEcologySummary{
 const resources=Object.values(w.resources).filter(r=>r.id.startsWith(RICH_RESOURCE_PREFIX)),forage=Object.values(w.forage).filter(f=>f.id.startsWith(RICH_FORAGE_PREFIX)),byItem:Partial<Record<ItemId,number>>={},quadrants:[0,0,0,0] as [number,number,number,number];
 for(const f of forage){const item=f.item??f.kind??'fiber';byItem[item]=(byItem[item]??0)+1;const q=(f.position[0]>=0?1:0)+(f.position[2]>=0?2:0);quadrants[q]++;}
 return {resources:resources.length,trees:resources.filter(r=>r.kind==='tree').length,rocks:resources.filter(r=>r.kind==='rock').length,forage:forage.length,byItem,quadrants};
}

/**
 * Adds a dense but bounded gatherable ecology to old and new saves.
 *
 * Rendering remains cheap because IDs use the existing wild-resource prefix: FrontierRenderer
 * groups distant trees/rocks into 64m InstancedMesh cells and promotes only nearby nodes to
 * detailed meshes/colliders. Forage already has a 65m visual materialization gate in Nature.
 */
export function seedResourceEcology(w:WorldState,seed=w.worldSeed??197709){
 if(w.progress.includes(RESOURCE_ECOLOGY_VERSION))return resourceEcologySummary(w);
 w.worldSeed??=seed;
 const resourceCells=Math.floor((WORLD_HALF*2-24)/RESOURCE_STEP),resourceStart=-resourceCells*RESOURCE_STEP/2;
 for(let gx=0;gx<=resourceCells;gx++)for(let gz=0;gz<=resourceCells;gz++){
  const rng=random(cellSeed(seed,gx,gz,0x45d9f3b)),x=resourceStart+gx*RESOURCE_STEP+(rng()-.5)*RESOURCE_STEP*.74,z=resourceStart+gz*RESOURCE_STEP+(rng()-.5)*RESOURCE_STEP*.74;
  if(Math.abs(x)>WORLD_HALF-12||Math.abs(z)>WORLD_HALF-12||trailDistance(x,z)<4.7)continue;
  const y=height(x,z);if(!Number.isFinite(y)||y<-1.05)continue;const p:[number,number,number]=[x,y,z];if(occupied(w,p,5.4))continue;
  const woods=forestDensity(x,z),r=region(x,z),spawnChance=Math.min(.94,(r==='ironward'?.64:r==='briar'?.61:r==='southwood'?.70:.53)+woods*.24);
  if(rng()>spawnChance)continue;
  const rockChance=r==='ironward'?.54+(1-woods)*.12:r==='briar'?.27+(1-woods)*.08:r==='march'?.20:.16+(1-woods)*.06,kind:ResourceState['kind']=rng()<rockChance?'rock':'tree';
  const id=`${RICH_RESOURCE_PREFIX}${gx}-${gz}`;if(w.resources[id])continue;
  w.resources[id]={id,kind,position:p,variant:Math.floor(rng()*3),health:kind==='rock'?4:6,phase:'standing',rotation:rng()*Math.PI*2,scale:kind==='rock'?.82+rng()*.34:.78+rng()*.44};
 }
 const forageCells=Math.floor((WORLD_HALF*2-18)/FORAGE_STEP),forageStart=-forageCells*FORAGE_STEP/2;
 for(let gx=0;gx<=forageCells;gx++)for(let gz=0;gz<=forageCells;gz++){
  const rng=random(cellSeed(seed,gx,gz,0x27d4eb2)),x=forageStart+gx*FORAGE_STEP+(rng()-.5)*FORAGE_STEP*.80,z=forageStart+gz*FORAGE_STEP+(rng()-.5)*FORAGE_STEP*.80;
  if(Math.abs(x)>WORLD_HALF-9||Math.abs(z)>WORLD_HALF-9||trailDistance(x,z)<2.7)continue;
  const y=height(x,z);if(!Number.isFinite(y)||y<-1.02)continue;const p:[number,number,number]=[x,y,z];if(occupied(w,p,2.6))continue;
  const woods=forestDensity(x,z),edge=forestEdge(x,z),meadow=meadowDensity(x,z),chance=Math.min(.60,.26+woods*.14+edge*.12+meadow*.10);
  if(rng()>chance)continue;
  const item=weightedForage(rng,x,z),id=`${RICH_FORAGE_PREFIX}${gx}-${gz}`;if(w.forage[id])continue;
  w.forage[id]={id,kind:forageVisual(item),item,position:p,harvested:false};
 }
 w.progress.push(RESOURCE_ECOLOGY_VERSION);
 return resourceEcologySummary(w);
}
