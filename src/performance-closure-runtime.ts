import * as T from 'three';
import {Landscape} from './landscape';
import {Nature} from './nature';
import {Combat} from './combat';
import {Gathering} from './gathering';
import {OBSERVER_GRASS_RINGS,type GrassRingSpec} from './observer-grass-clipmap';
import {conservativeQualityCeiling,matrixSlotHasArea,observerGrassRank,observerMetric2d,shouldSubmitObserverGrass} from './performance-closure';

const INSTALL=Symbol.for('alderwatch.performance-closure.v1');
const INTERIOR=Symbol.for('alderwatch.instanced-interior.active');
const MANAGED=Symbol.for('alderwatch.performance-closure.managed');
const grassSpecs=new Map<string,GrassRingSpec>(OBSERVER_GRASS_RINGS.map(spec=>[spec.id,spec]));
const outdoorObjects=new Set<T.Object3D>();
const priorInteriorVisibility=new WeakMap<T.Object3D,boolean>();
let latestRuntime:LandscapePerformanceRuntime|undefined;

type GlobalState=typeof globalThis&{[key:symbol]:unknown};
const globalState=globalThis as GlobalState;

export function instancedInteriorActive(){return globalState[INTERIOR]===true;}

function registerOutdoorObject(object:T.Object3D){
 outdoorObjects.add(object);
 if(instancedInteriorActive()&&!priorInteriorVisibility.has(object)){
  priorInteriorVisibility.set(object,object.visible);object.visible=false;
 }
}

/**
 * Enterable interiors are separate presentation spaces. Outdoor observer fields,
 * wildlife AI and combat presentation have no visible contribution while the
 * camera is in one, so suspend them instead of paying for an invisible March.
 */
export function setInstancedInteriorActive(active:boolean){
 if(instancedInteriorActive()===active)return;
 globalState[INTERIOR]=active;
 if(typeof document!=='undefined'){
  if(active)document.documentElement.dataset.awInterior='tavern';
  else delete document.documentElement.dataset.awInterior;
 }
 for(const object of [...outdoorObjects]){
  if(!object.parent){outdoorObjects.delete(object);continue;}
  if(active){if(!priorInteriorVisibility.has(object))priorInteriorVisibility.set(object,object.visible);object.visible=false;}
  else if(priorInteriorVisibility.has(object)){object.visible=priorInteriorVisibility.get(object)!;priorInteriorVisibility.delete(object);}
 }
}

interface CompactorStats{name:string;logical:number;submitted:number;culled:number;quality:number;reason:string}

class StableSlotCompactor{
 private logicalMatrices:Float32Array;
 private logicalColors?:Float32Array;
 private dirty=true;
 private lastX=Infinity;
 private lastZ=Infinity;
 private lastQualityCeiling=-1;
 private readonly capacity:number;
 private readonly grass?:GrassRingSpec;
 private readonly movementThreshold:number;
 stats:CompactorStats;
 constructor(private mesh:T.InstancedMesh){
  this.capacity=mesh.instanceMatrix.count;
  this.logicalMatrices=new Float32Array(mesh.instanceMatrix.array as ArrayLike<number>);
  if(mesh.instanceColor)this.logicalColors=new Float32Array(mesh.instanceColor.array as ArrayLike<number>);
  const match=/^Observer grass (.+?) torus$/.exec(mesh.name);this.grass=match?grassSpecs.get(match[1]):undefined;
  this.movementThreshold=this.grass?Math.max(.2,Math.min(1.25,this.grass.cell*.32)):Infinity;
  this.stats={name:mesh.name,logical:this.capacity,submitted:this.capacity,culled:0,quality:1,reason:this.grass?'zero-scale + conservative shader-equivalence':'zero-scale'};
  mesh.frustumCulled=true;(mesh.userData as Record<PropertyKey,unknown>)[MANAGED]=true;
  mesh.setMatrixAt=((index:number,matrix:T.Matrix4)=>{
   if(index<0||index>=this.capacity)return;this.logicalMatrices.set(matrix.elements,index*16);this.dirty=true;
  }) as T.InstancedMesh['setMatrixAt'];
  if(mesh.instanceColor){
   mesh.setColorAt=((index:number,color:T.Color)=>{
    if(!this.logicalColors||index<0||index>=this.capacity)return;this.logicalColors[index*3]=color.r;this.logicalColors[index*3+1]=color.g;this.logicalColors[index*3+2]=color.b;this.dirty=true;
   }) as T.InstancedMesh['setColorAt'];
  }
  registerOutdoorObject(mesh);
 }
 flush(center:{x:number;z:number},force=false){
  const material=this.mesh.material as T.Material;
  const quality=this.grass?Number((material.userData.awObserverQuality as {value?:number}|undefined)?.value??1):1;
  const qualityCeiling=conservativeQualityCeiling(quality);
  const moved=Math.hypot(center.x-this.lastX,center.z-this.lastZ);
  if(!force&&!this.dirty&&qualityCeiling===this.lastQualityCeiling&&moved<this.movementThreshold)return false;
  const output=this.mesh.instanceMatrix.array as Float32Array,colorOutput=this.mesh.instanceColor?.array as Float32Array|undefined;
  const motionMargin=this.grass?this.movementThreshold*1.12:0;
  let submitted=0;
  for(let slot=0;slot<this.capacity;slot++){
   const offset=slot*16;if(!matrixSlotHasArea(this.logicalMatrices,offset))continue;
   if(this.grass){
    const x=this.logicalMatrices[offset+12],z=this.logicalMatrices[offset+14],distance=observerMetric2d(x-center.x,z-center.z,this.grass.metricPower),rank=observerGrassRank(x,z,this.grass);
    if(!shouldSubmitObserverGrass(rank,distance,quality,this.grass,motionMargin))continue;
   }
   output.set(this.logicalMatrices.subarray(offset,offset+16),submitted*16);
   if(this.logicalColors&&colorOutput)colorOutput.set(this.logicalColors.subarray(slot*3,slot*3+3),submitted*3);
   submitted++;
  }
  this.mesh.count=submitted;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;
  if(submitted)this.mesh.computeBoundingSphere();else this.mesh.boundingSphere=new T.Sphere(new T.Vector3(),0);
  this.dirty=false;this.lastX=center.x;this.lastZ=center.z;this.lastQualityCeiling=qualityCeiling;
  this.stats={...this.stats,logical:this.capacity,submitted,culled:this.capacity-submitted,quality};return true;
 }
}

class BoundWatcher{
 private version=-1;private count=-1;
 constructor(private mesh:T.InstancedMesh){mesh.frustumCulled=true;registerOutdoorObject(mesh);}
 refresh(){
  if(this.version===this.mesh.instanceMatrix.version&&this.count===this.mesh.count)return;
  this.version=this.mesh.instanceMatrix.version;this.count=this.mesh.count;
  if(this.mesh.count)this.mesh.computeBoundingSphere();else this.mesh.boundingSphere=new T.Sphere(new T.Vector3(),0);
 }
}

class LandscapePerformanceRuntime{
 private compactors:StableSlotCompactor[]=[];
 private bounds:BoundWatcher[]=[];
 private seen=new WeakSet<T.Object3D>();
 private scans=0;private nextScan=0;
 stats={logicalInstances:0,submittedInstances:0,culledInstances:0,managedMeshes:0};
 constructor(private landscape:Landscape){this.scan(true);}
 private scan(force=false){
  const now=typeof performance!=='undefined'?performance.now():0;if(!force&&(this.scans>=3||now<this.nextScan))return;this.nextScan=now+1800;this.scans++;
  this.landscape.scene.traverse(object=>{
   if(this.seen.has(object))return;
   if(object.name==='Alderwatch simulated players'){this.seen.add(object);registerOutdoorObject(object);return;}
   if(!(object instanceof T.InstancedMesh))return;
   if(/^Observer grass /.test(object.name)||/^Observer ecology /.test(object.name)){
    this.seen.add(object);this.compactors.push(new StableSlotCompactor(object));return;
   }
   if(/^Observer horizon forest /.test(object.name)||object.name==='Observer forest contact field'){
    this.seen.add(object);this.bounds.push(new BoundWatcher(object));
   }
  });
 }
 afterUpdate(){
  this.scan();const player=this.landscape.state.players['player-local']??Object.values(this.landscape.state.players).find(p=>!p.id.startsWith('player-bot-'))??Object.values(this.landscape.state.players)[0];if(!player)return;
  const center={x:player.position[0],z:player.position[2]};for(const compactor of this.compactors)compactor.flush(center);for(const watcher of this.bounds)watcher.refresh();
  this.stats.logicalInstances=this.compactors.reduce((n,c)=>n+c.stats.logical,0);this.stats.submittedInstances=this.compactors.reduce((n,c)=>n+c.stats.submitted,0);this.stats.culledInstances=this.stats.logicalInstances-this.stats.submittedInstances;this.stats.managedMeshes=this.compactors.length+this.bounds.length;
 }
 suspend(){for(const object of outdoorObjects)if(object.parent&&object.visible&&!priorInteriorVisibility.has(object)){priorInteriorVisibility.set(object,true);object.visible=false;}}
 read(){return{...this.stats,interior:instancedInteriorActive(),meshes:this.compactors.map(c=>({...c.stats}))};}
}

export function readPerformanceClosure(){return latestRuntime?.read()??{logicalInstances:0,submittedInstances:0,culledInstances:0,managedMeshes:0,interior:instancedInteriorActive(),meshes:[]};}

function suspendMethod(proto:any,key:string,empty?:unknown){const original=proto[key];if(typeof original!=='function')return;proto[key]=function(...args:any[]){if(instancedInteriorActive())return empty;return original.apply(this,args);};}

function install(){
 if(globalState[INSTALL])return;globalState[INSTALL]=true;
 const proto=Landscape.prototype as any,update=proto.update;
 proto.update=function(this:Landscape,...args:any[]){
  let runtime=(this as any).__awPerformanceClosure as LandscapePerformanceRuntime|undefined;if(!runtime){runtime=new LandscapePerformanceRuntime(this);(this as any).__awPerformanceClosure=runtime;latestRuntime=runtime;}
  if(instancedInteriorActive()){runtime.suspend();return;}
  const out=update.apply(this,args);runtime.afterUpdate();return out;
 };
 // These systems are entirely outdoor in the current Far March. Pausing them in
 // an instanced social interior changes no visible frame and avoids 60 Hz AI,
 // animation, particle and target-search work against a world the player cannot see.
 suspendMethod(Nature.prototype,'update');
 suspendMethod(Combat.prototype,'preStep');suspendMethod(Combat.prototype,'postStep');
 suspendMethod(Combat.prototype,'nearest',undefined);suspendMethod(Combat.prototype,'animalTarget',undefined);suspendMethod(Combat.prototype,'target',undefined);
 suspendMethod(Gathering.prototype,'update');suspendMethod(Gathering.prototype,'nearest',undefined);
}

if(typeof window!=='undefined'&&typeof document!=='undefined')install();
