import type {Character} from './character';
import {StreamedObserverGrassField,type StreamedGrassBiome,type StreamedGrassSample} from './streamed-observer-grass';
import {CROWNROAD_VALE,IRONWARD_BASIN,WOLFPINE} from './realm-save';

const INSTALL=Symbol.for('alderwatch.streamed-frontier-graphics.v1');
const fields=new Map<Character,{field:StreamedObserverGrassField;lastWall:number}>();

function roadClear(area:string,x:number,z:number){
 if(area===CROWNROAD_VALE){
  if(Math.abs(z)<4||Math.abs(x)<4)return true;
  if(Math.abs(x+96)<3&&z>=-150&&z<=8)return true;
  if(Math.abs(x-144)<3&&z>=-150&&z<=8)return true;
  if(Math.abs(z-192)<3&&x>=-150&&x<=8)return true;
  if(Math.abs(z-96)<3&&x>=-8&&x<=246)return true;
  if(Math.abs(x)<=72&&Math.abs(z)<=72)return true; // Greyhaven's authored nine-cell footprint owns its ground.
 }
 if(area===IRONWARD_BASIN)return Math.abs(x)<4||Math.abs(z)<3.5;
 if(area===WOLFPINE){
  if(Math.abs(z)<4)return true;
  if(Math.abs(x)<3&&z>-110)return true;
  if(Math.abs(z-48)<3&&x>-8&&x<108)return true;
  if(Math.hypot(x,z+48)<20||Math.hypot(x-96,z-48)<25)return true;
 }
 return false;
}
function biome(area:string):StreamedGrassBiome{return area===WOLFPINE?'wolfpine':area===IRONWARD_BASIN?'ironward':'crownroad';}
function sample(area:string,x:number,z:number):StreamedGrassSample{return{y:0,blocked:roadClear(area,x,z),density:area===WOLFPINE?.86:area===IRONWARD_BASIN?.92:1};}

export function installStreamedFrontierGraphics(CharacterClass:{prototype:Character}){
 const g=globalThis as Record<PropertyKey,unknown>;if(g[INSTALL])return;g[INSTALL]=true;
 const proto=CharacterClass.prototype as Character,oldPost=proto.postStep;
 proto.postStep=function(this:Character,dt:number){
  oldPost.call(this,dt);const area=this.state.areaId??'';if(area!==CROWNROAD_VALE&&area!==IRONWARD_BASIN&&area!==WOLFPINE)return;
  let runtime=fields.get(this);if(!runtime){const parent=this.root.parent;if(!parent)return;runtime={field:new StreamedObserverGrassField(parent,this.assets,{biome:biome(area),sample:(x,z)=>sample(area,x,z)}),lastWall:performance.now()};fields.set(this,runtime);}
  const now=performance.now(),frameMs=Math.max(5,Math.min(80,now-runtime.lastWall));runtime.lastWall=now;const stats=runtime.field.update(this.root.position.x,this.root.position.z,frameMs);(globalThis as any).__alderwatchStreamedGraphics={area,quality:stats.quality,writes:stats.writes,frameMs:stats.frameMs};
 };
 window.addEventListener('pagehide',()=>{for(const runtime of fields.values())runtime.field.dispose();fields.clear();},{once:true});
}
