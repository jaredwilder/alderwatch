import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {Assets} from '../src/assets';
import {Character} from '../src/character';
import {combatClip,meleeBodyTrack} from '../src/combat-animation';
import {WEAPONS} from '../src/combat-rules';
import {makePlayer} from '../src/state';
import {model} from './load-assets';

async function fixture(){
 await RAPIER.init();const assets=new Assets();[assets.survivor,assets.kit]=await Promise.all([model('survivor'),model('frontier-kit')]);
 const physics=new RAPIER.World({x:0,y:-9.81,z:0});physics.createCollider(RAPIER.ColliderDesc.cuboid(20,.1,20).setTranslation(0,-.1,0));
 const scene=new T.Group(),p=makePlayer('Warden');p.position=[0,.02,0];p.yaw=0;p.equipped='axe';let tick=0;const actor=new Character(assets,physics,p,scene);actor.getTick=()=>tick;actor.equip('axe');
 const input={keys:new Set<string>(),secondary:false,take:()=>false};const step=()=>{actor.preStep(1/120,input,Math.PI,true);physics.timestep=1/120;physics.step();actor.postStep(1/120);scene.updateMatrixWorld(true);tick+=.5;};return{assets,physics,scene,p,actor,step};
}
function wrappedDelta(a:number,b:number){return T.MathUtils.euclideanModulo(b-a+Math.PI,Math.PI*2)-Math.PI;}
async function measure(sourceName:'chop'|'attack'){
 const f=await fixture(),source=f.assets.survivor.animations.find(c=>c.name===sourceName)!;
 if(sourceName!=='chop'){
  const clip=combatClip(source,'chop',13/30,WEAPONS.axe!.impact,WEAPONS.axe!.duration);
  f.actor.actions.set('chop',f.actor.mixer.clipAction(clip));
  f.actor.actions.set('chop_moving',f.actor.mixer.clipAction(new T.AnimationClip('chop_moving',clip.duration,clip.tracks.filter(t=>meleeBodyTrack(t.name)).map(t=>t.clone()))));
 }
 const pelvis=f.actor.model.getObjectByName('pelvis');assert.ok(pelvis instanceof T.Bone);const rest=pelvis.quaternion.clone(),samples:{t:number;x:number;y:number;z:number;angle:number;speed:number;hip:number}[]=[];let previous:T.Vector3|undefined;
 assert.equal(f.actor.startAttack(),true);
 for(let i=0;i<=Math.ceil(WEAPONS.axe!.duration*120)+2;i++){
  f.step();const p=f.actor.tool!.localToWorld(new T.Vector3(-.38,.49,0)),t=f.actor.attackTime,speed=previous?p.distanceTo(previous)*120:0;samples.push({t,x:p.x-f.actor.root.position.x,y:p.y-f.actor.root.position.y,z:p.z-f.actor.root.position.z,angle:Math.atan2(p.x-f.actor.root.position.x,p.z-f.actor.root.position.z),speed,hip:rest.angleTo(pelvis.quaternion)});previous=p.clone();
 }
 const near=(t:number)=>samples.reduce((a,b)=>Math.abs(b.t-t)<Math.abs(a.t-t)?b:a),contact=near(WEAPONS.axe!.impact),wind=near(WEAPONS.axe!.impact*.45),follow=near(WEAPONS.axe!.impact+(WEAPONS.axe!.duration-WEAPONS.axe!.impact)*.38),peak=samples.reduce((a,b)=>b.speed>a.speed?b:a),arc=wrappedDelta(wind.angle,follow.angle),maxHip=Math.max(...samples.map(s=>s.hip));f.physics.free();
 return {sourceName,wind,contact,follow,peak,arc,maxHip};
}

test('diagnose current and combat-source axe arcs against responsive melee timing',async()=>{
 const current=await measure('chop'),combat=await measure('attack');
 assert.fail(`MELEE_ARC_DIAGNOSTIC ${JSON.stringify({timing:{sword:WEAPONS.sword,axe:WEAPONS.axe,pickaxe:WEAPONS.pickaxe,hammer:WEAPONS.hammer},current,combat})}`);
});
