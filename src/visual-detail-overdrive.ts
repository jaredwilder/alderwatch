import * as T from 'three';
import {Assets} from './assets';
import {Landscape} from './landscape';
import {forestDensity,forestEdge,meadowDensity} from './ecology';
import {height,roadX} from './terrain';
import {trailDistance} from './worldgen';

export interface DetailGrassPlacement {x:number;z:number;y:number;scale:T.Vector3;yaw:number}
const MAX_DETAIL_GRASS=18000;

function hash2(x:number,z:number,salt:number){
 let h=(Math.imul((x|0)^salt,0x45d9f3b)^Math.imul((z|0)+salt,0x27d4eb2d))|0;
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;return (h>>>0)/4294967296;
}

/**
 * Deterministic stratified near-field coverage. One candidate per coarse cell gives
 * blue-noise-ish spacing without a Poisson solve or a giant authored mesh. The
 * existing Landscape.batch path then tiles these into frustum-cullable instanced draws.
 */
export function detailGrassPlacements(step=1.25):DetailGrassPlacement[]{
 const out:DetailGrassPlacement[]=[];
 let ix=0;
 for(let gx=-120;gx<=120;gx+=step,ix++){
  let iz=0;
  for(let gz=-155;gz<=100;gz+=step,iz++){
   const jx=(hash2(ix,iz,17)-.5)*step*.82,jz=(hash2(ix,iz,31)-.5)*step*.82;
   const x=gx+jx,z=gz+jz,y=height(x,z);
   if(!Number.isFinite(y)||y<-1.08)continue;
   const road=z>45?trailDistance(x,z):Math.abs(x-roadX(z));
   if(road<3.05)continue;
   const woods=forestDensity(x,z),edge=forestEdge(x,z),meadow=meadowDensity(x,z);
   const density=Math.max(.04,Math.min(.72,.12+meadow*.56+edge*.20-woods*.46));
   if(hash2(ix,iz,73)>density)continue;
   const scale=.70+hash2(ix,iz,101)*.38;
   const blade=.34+hash2(ix,iz,131)*.34;
   out.push({x,z,y:y-.042,scale:new T.Vector3(scale,blade,scale),yaw:hash2(ix,iz,211)*Math.PI*2});
   if(out.length>=MAX_DETAIL_GRASS)return out;
  }
 }
 return out;
}

function sharpenLoadedSurfaces(assets:Assets){
 for(const key of ['oak-color','oak-normal','oak-rough','rock-color','rock-normal','rock-rough']){
  const texture=assets.textures[key];if(!texture)continue;
  texture.anisotropy=Math.max(texture.anisotropy,12);
  texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;
 }
 assets.kit?.scene.traverse(o=>{
  if(!(o instanceof T.Mesh))return;
  const materials=(Array.isArray(o.material)?o.material:[o.material]) as T.MeshStandardMaterial[];
  for(const m of materials){
   if(m.name==='AW_bark'&&m.normalMap)m.normalScale.multiplyScalar(1.16);
   if(m.name==='AW_stone'&&m.normalMap)m.normalScale.multiplyScalar(1.22);
  }
 });
}

function install(){
 const g=globalThis as Record<PropertyKey,unknown>,marker=Symbol.for('alderwatch.visual-detail-overdrive.v1');
 if(g[marker])return;g[marker]=true;
 const assetsProto=Assets.prototype as any,oldLoad=assetsProto.load;
 if(!assetsProto.__awDetailLoad){assetsProto.load=async function(...args:any[]){const out=await oldLoad.apply(this,args);sharpenLoadedSurfaces(this);return out;};assetsProto.__awDetailLoad=true;}
 const landscapeProto=Landscape.prototype as any,oldPopulate=landscapeProto.populate;
 if(!landscapeProto.__awDetailGrass){landscapeProto.populate=function(...args:any[]){const out=oldPopulate.apply(this,args);this.batch('grass',detailGrassPlacements());return out;};landscapeProto.__awDetailGrass=true;}
}

if(typeof window!=='undefined')install();
