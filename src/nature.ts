import * as T from 'three';
import {Assets} from './assets';
import {Landscape,random} from './landscape';
import {height,roadX} from './terrain';
import type {WorldState,Vec3,ForageState} from './state';

export interface AnimalState {id:string;kind:'hare'|'crow';position:Vec3;home:Vec3;yaw:number;phase:number;avoidUntil?:number}
const MODELS={berries:'berry_bush',mushroom:'mushrooms',herb:'herbs',wood:'fallen_branch',fiber:'flax'};
export function seedNature(w:WorldState){
 const rng=random(4872);
 for(let i=0;i<68;i++){
  const z=24-rng()*110,x=roadX(z)+(i%2?1:-1)*(3.3+rng()*12),id='nature-forage-'+i;
  if(w.forage[id]||height(x,z)<-.8||Object.values(w.structures).some(s=>Math.hypot(x-s.position[0],z-s.position[2])<3)||Object.values(w.stations).some(s=>Math.hypot(x-s.position[0],z-s.position[2])<2)||Object.values(w.resources).some(r=>r.phase==='standing'&&Math.hypot(x-r.position[0],z-r.position[2])<1.5))continue;
  w.forage[id]={id,kind:(['berries','mushroom','herb','wood'] as const)[i%4],position:[x,height(x,z),z],harvested:false};
 }
 w.animals??={};for(const [i,kind,x,z] of [[0,'hare',4,14],[1,'hare',-5,-17],[2,'crow',3,3],[3,'crow',-4,-38]] as const){const id='wildlife-'+i;w.animals[id]??={id,kind,position:[x,height(x,z),z],home:[x,height(x,z),z],yaw:i,phase:i*2};}
}
export function forageAvailable(f:ForageState,tick:number){return !f.harvested||(f.readyAt!==undefined&&f.readyAt<=tick);}
export class Nature {
 plants=new Map<string,T.Object3D>();animals=new Map<string,T.Object3D>();
 constructor(private root:T.Group,private assets:Assets,private w:WorldState,private land:Landscape){
  seedNature(w);for(const a of Object.values(w.animals!)){const model=assets.prop(a.kind);model.rotation.y=Math.PI;const group=new T.Group();group.name=a.id;group.add(model);group.position.fromArray(a.position);root.add(group);this.animals.set(a.id,group);}
  this.update(0);
 }
 update(dt:number){
  for(const f of Object.values(this.w.forage).filter(f=>f.id.startsWith('nature-forage-'))){
   const visible=Object.values(this.w.players).some(p=>Math.hypot(p.position[0]-f.position[0],p.position[2]-f.position[2])<65)&&forageAvailable(f,this.w.tick)&&!this.land.ambientOccupied(f.position[0],f.position[2])&&!Object.values(this.w.structures).some(s=>Math.hypot(s.position[0]-f.position[0],s.position[2]-f.position[2])<2);
   let model=this.plants.get(f.id);if(visible&&!model){model=this.assets.prop(MODELS[f.kind??'fiber']);model.position.fromArray(f.position);model.rotation.y=Number(f.id.split('-').at(-1))*2.4;model.scale.setScalar(f.kind==='mushroom'?1.45:1.15);this.root.add(model);this.plants.set(f.id,model);}if(model)model.visible=visible;
  }
  for(const a of Object.values(this.w.animals!)){
   const model=this.animals.get(a.id)!;const p=Object.values(this.w.players).filter(p=>p.health>0).sort((p,q)=>Math.hypot(p.position[0]-a.position[0],p.position[2]-a.position[2])-Math.hypot(q.position[0]-a.position[0],q.position[2]-a.position[2]))[0];
   const near=p?Math.hypot(p.position[0]-a.position[0],p.position[2]-a.position[2]):Infinity,flee=near<6;
   a.phase+=dt;const homeDistance=Math.hypot(a.home[0]-a.position[0],a.home[2]-a.position[2]);
   let desired=flee?Math.atan2(a.position[0]-p.position[0],a.position[2]-p.position[2]):homeDistance>8?Math.atan2(a.home[0]-a.position[0],a.home[2]-a.position[2]):Math.sin(a.phase*.17)*Math.PI;
   const moving=flee||homeDistance>8||Math.sin(a.phase*.7)>.5,flight=a.kind==='crow'&&(flee||homeDistance>8||Math.sin(a.phase*.7)>.5);
   if((a.avoidUntil??0)>this.w.tick)desired=a.yaw;a.yaw+=T.MathUtils.clamp(T.MathUtils.euclideanModulo(desired-a.yaw+Math.PI,Math.PI*2)-Math.PI,-dt*5,dt*5);const speed=moving?(flee?3.8:flight?2.2:.6):0;
   const x=a.position[0]+Math.sin(a.yaw)*speed*dt,z=a.position[2]+Math.cos(a.yaw)*speed*dt;
   const clear=height(x,z)>-1&&!this.land.ambientOccupied(x,z)&&Object.values(this.w.resources).every(r=>r.phase!=='standing'||Math.hypot(x-r.position[0],z-r.position[2])>(r.kind==='tree'?1.1:1.2))&&Object.values(this.w.structures).every(s=>Math.hypot(x-s.position[0],z-s.position[2])>2);
   if(clear||(flight&&!this.land.ambientOccupied(x,z)&&Object.values(this.w.structures).every(s=>Math.hypot(x-s.position[0],z-s.position[2])>2))){a.position[0]=x;a.position[2]=z;}else{a.yaw+=Math.PI*.6;a.avoidUntil=this.w.tick+50;}
   const ground=height(a.position[0],a.position[2]),lift=a.kind==='hare'&&moving?Math.max(0,Math.sin(a.phase*(flee?14:8)))*.15:flight?1.7+Math.sin(a.phase*3)*.12:0;
   a.position[1]=T.MathUtils.damp(a.position[1],ground+lift,flight?4:16,dt);model.position.fromArray(a.position);model.rotation.y=a.yaw;
   model.traverse(part=>{
    if(part.name.startsWith('Hare_front'))part.rotation.x=moving?Math.sin(a.phase*(flee?14:8))*.55:0;
    if(part.name.startsWith('Hare_hind'))part.rotation.x=moving?-Math.sin(a.phase*(flee?14:8))*.65:0;
    if(part.name==='Hare_head')part.rotation.x=moving?.08:Math.sin(a.phase*1.3)*.13;
    if(part.name.startsWith('Hare_ear'))part.rotation.z=Math.sin(a.phase*2)*.04;
    if(part.name.startsWith('Crow_wing'))part.rotation.z=(part.name.endsWith('-1')?-1:1)*(flight?Math.sin(a.phase*13)*.85:.95);
   });
  }
 }
}
